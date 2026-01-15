#!/usr/bin/env tsx
/**
 * Database Backup Script
 *
 * Creates a PostgreSQL backup using pg_dump
 *
 * AUTOMATIC VERSION MATCHING:
 * - Uses Docker with PostgreSQL 17 by default (matches Supabase)
 * - Falls back to local pg_dump if Docker is not available
 * - No need to upgrade your local PostgreSQL!
 *
 * Usage:
 *   npm run db:backup
 *   or
 *   tsx scripts/backup-db.ts
 *
 * Options:
 *   USE_LOCAL_PGDUMP=true npm run db:backup  # Force local pg_dump
 *
 * The backup will be saved to ./backups/ directory with a timestamp
 */

import { execSync } from 'child_process';
import { mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  try {
    // Parse PostgreSQL connection string
    // Format: postgresql://user:password@host:port/database?params
    const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = url.match(urlPattern);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    return {
      host,
      port,
      database,
      user: decodeURIComponent(user),
      password: decodeURIComponent(password),
    };
  } catch (error) {
    throw new Error(`Failed to parse DATABASE_URL: ${error}`);
  }
}

function isDockerAvailable(): boolean {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getPgDumpVersion(): string | null {
  try {
    const output = execSync('pg_dump --version', { encoding: 'utf-8' });
    const match = output.match(/pg_dump \(PostgreSQL\) (\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function createBackupWithDocker(config: DatabaseConfig, outputPath: string): void {
  console.log('🐳 Using Docker with PostgreSQL 17 (version-matched backup)');
  console.log('🔄 Starting database backup...');
  console.log(`📊 Database: ${config.database}`);
  console.log(`🖥️  Host: ${config.host}:${config.port}`);

  // Get just the filename from the full path
  const filename = outputPath.split('/').pop() || 'backup.dump';

  // Docker command to run pg_dump with PostgreSQL 17
  const dockerArgs = [
    'run',
    '--rm',
    '-e', `PGPASSWORD=${config.password}`,
    '-v', `${process.cwd()}/backups:/backups`,
    'postgres:17-alpine',
    'pg_dump',
    '-h', config.host,
    '-p', config.port,
    '-U', config.user,
    '-d', config.database,
    '-F', 'c', // Custom format (compressed)
    '-f', `/backups/${filename}`,
    '--no-owner',
    '--no-acl',
    '-v',
  ];

  const command = `docker ${dockerArgs.join(' ')}`;

  console.log('⏳ Running pg_dump via Docker...');

  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit', // Show Docker output
    });

    console.log(`✅ Backup created successfully!`);
    console.log(`📁 Location: ${outputPath}`);
  } catch (error: any) {
    console.error('❌ Docker backup failed:', error.message);
    throw error;
  }
}

function createBackup(config: DatabaseConfig, outputPath: string): void {
  console.log('🔄 Starting database backup...');
  console.log(`📊 Database: ${config.database}`);
  console.log(`🖥️  Host: ${config.host}:${config.port}`);

  // Set PGPASSWORD environment variable for pg_dump
  const env = {
    ...process.env,
    PGPASSWORD: config.password,
  };

  // Build pg_dump command
  const pgDumpArgs = [
    '-h', config.host,
    '-p', config.port,
    '-U', config.user,
    '-d', config.database,
    '-F', 'c', // Custom format (compressed)
    '-f', outputPath,
    '--no-owner', // Don't output commands to set ownership
    '--no-acl',   // Don't output access privilege commands
    '-v',         // Verbose mode
  ];

  const command = `pg_dump ${pgDumpArgs.join(' ')}`;

  console.log('⏳ Running pg_dump...');
  
  try {
    // Capture both stdout and stderr to check for version mismatch
    const output = execSync(command, {
      env,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    });
    
    // If we get here, backup was successful
    console.log(`✅ Backup created successfully!`);
    console.log(`📁 Location: ${outputPath}`);
  } catch (error: any) {
    // Capture stderr output
    const stderr = error.stderr?.toString() || error.stdout?.toString() || '';
    const errorMessage = error.message || '';
    const fullError = (stderr + ' ' + errorMessage).toLowerCase();
    
    // Check for version mismatch error in stderr or error message
    if (fullError.includes('version mismatch') || 
        fullError.includes('server version') ||
        fullError.includes('aborting because of server version')) {
      // Print the actual error first
      if (stderr) {
        console.error(stderr);
      }
      
      console.error('\n❌ Version Mismatch Error!');
      console.error('   Your pg_dump version is older than the database server version.');
      console.error('\n📋 To fix this issue:');
      console.error('   1. Upgrade PostgreSQL client tools:');
      console.error('      macOS: brew upgrade postgresql');
      console.error('      macOS (alternative): brew install postgresql@17');
      console.error('      Ubuntu/Debian: sudo apt-get update && sudo apt-get install postgresql-client-17');
      console.error('\n   2. The script will try DIRECT_URL automatically if available...\n');
      
      // Throw specific error that can be caught by caller
      throw new Error('VERSION_MISMATCH');
    }
    
    // For other errors, show the actual error output
    if (stderr) {
      console.error(stderr);
    }
    console.error('❌ Backup failed:', errorMessage || 'Unknown error');
    throw error;
  }
}

function createBackupDirectory(): string {
  const backupsDir = join(process.cwd(), 'backups');
  
  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
    console.log(`📁 Created backups directory: ${backupsDir}`);
  }

  return backupsDir;
}

function generateBackupFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  return `backup_${timestamp}.dump`;
}

function main() {
  console.log('🚀 Database Backup Tool\n');

  // Check environment
  const useLocalPgDump = process.env.USE_LOCAL_PGDUMP === 'true';
  const dockerAvailable = isDockerAvailable();

  // Try DATABASE_URL first, then DIRECT_URL if available
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL in your .env file');
    process.exit(1);
  }

  try {
    // Parse database URL
    let config = parseDatabaseUrl(databaseUrl);

    // Create backups directory
    const backupsDir = createBackupDirectory();

    // Generate backup filename
    const filename = generateBackupFileName();
    const outputPath = join(backupsDir, filename);

    // Decide which method to use
    let backupMethod: 'docker' | 'local' = 'local';

    if (!useLocalPgDump && dockerAvailable) {
      backupMethod = 'docker';
    } else if (useLocalPgDump) {
      console.log('⚙️  Using local pg_dump (USE_LOCAL_PGDUMP=true)');
      const pgDumpVersion = getPgDumpVersion();
      if (pgDumpVersion) {
        console.log(`📦 Local pg_dump version: ${pgDumpVersion}`);
      }
    } else if (!dockerAvailable) {
      console.log('⚠️  Docker not available, using local pg_dump');
      const pgDumpVersion = getPgDumpVersion();
      if (pgDumpVersion) {
        console.log(`📦 Local pg_dump version: ${pgDumpVersion}`);
      } else {
        console.error('❌ Error: pg_dump is not installed or not in PATH');
        console.error('   Install PostgreSQL client tools:');
        console.error('   - macOS: brew install postgresql');
        console.error('   - Ubuntu/Debian: sudo apt-get install postgresql-client');
        console.error('   - Windows: Download from https://www.postgresql.org/download/');
        console.error('\n   Or install Docker for automatic version matching.');
        process.exit(1);
      }
    }

    // Try to create backup
    try {
      if (backupMethod === 'docker') {
        createBackupWithDocker(config, outputPath);
      } else {
        createBackup(config, outputPath);
      }
    } catch (error: any) {
      // If version mismatch with local pg_dump and Docker is available, try Docker
      if (error.message === 'VERSION_MISMATCH' && !useLocalPgDump && dockerAvailable && backupMethod === 'local') {
        console.log('\n🔄 Retrying with Docker (version-matched)...\n');
        createBackupWithDocker(config, outputPath);
      } else if (error.message === 'VERSION_MISMATCH') {
        // Try DIRECT_URL as last resort
        if (process.env.DIRECT_URL) {
          console.log('\n🔄 Trying DIRECT_URL instead...\n');
          databaseUrl = process.env.DIRECT_URL;
          config = parseDatabaseUrl(databaseUrl);

          try {
            if (backupMethod === 'docker') {
              createBackupWithDocker(config, outputPath);
            } else {
              createBackup(config, outputPath);
            }
          } catch (retryError: any) {
            if (retryError.message === 'VERSION_MISMATCH') {
              console.error('\n❌ Version mismatch persists.');
              console.error('   Solution: Install Docker for automatic version matching.');
              console.error('   Or upgrade pg_dump: brew install postgresql@17\n');
              process.exit(1);
            }
            throw retryError;
          }
        } else {
          console.error('\n❌ Version mismatch and no fallback available.');
          console.error('   Solution: Install Docker for automatic version matching.');
          console.error('   Or upgrade pg_dump: brew install postgresql@17\n');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    // Get file size
    const stats = statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Backup size: ${fileSizeMB} MB`);

    console.log('\n✨ Backup completed successfully!');
  } catch (error: any) {
    if (error.message === 'VERSION_MISMATCH') {
      // Already handled above
      process.exit(1);
    }
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

