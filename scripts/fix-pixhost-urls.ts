/**
 * Script to fix PixHost URLs in the database
 * Converts show page URLs to direct image URLs
 */

import { prisma } from '../lib/prisma';
import { convertToFullSize } from '../lib/image-parser';

async function fixPixHostUrls() {
  console.log('Starting PixHost URL migration...\n');

  try {
    // Get all posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        imageUrls: true,
      },
    });

    console.log(`Found ${posts.length} posts to check\n`);

    let updatedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      let newThumbnailUrl = post.thumbnailUrl;
      let newImageUrls = [...post.imageUrls];

      // Check and fix thumbnail URL
      if (post.thumbnailUrl && post.thumbnailUrl.includes('pixhost.to')) {
        const converted = convertToFullSize(post.thumbnailUrl);
        if (converted !== post.thumbnailUrl) {
          newThumbnailUrl = converted;
          needsUpdate = true;
        }
      }

      // Check and fix image URLs
      for (let i = 0; i < post.imageUrls.length; i++) {
        const url = post.imageUrls[i];
        if (url.includes('pixhost.to')) {
          const converted = convertToFullSize(url);
          if (converted !== url) {
            newImageUrls[i] = converted;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            thumbnailUrl: newThumbnailUrl,
            imageUrls: newImageUrls,
          },
        });

        updatedCount++;
        console.log(`✓ Updated: ${post.title}`);
        console.log(`  Thumbnail: ${post.thumbnailUrl} -> ${newThumbnailUrl}`);
        console.log(`  Images: ${post.imageUrls.length} URL(s) converted\n`);
      }
    }

    console.log(`\n✓ Migration complete!`);
    console.log(`  Total posts checked: ${posts.length}`);
    console.log(`  Posts updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixPixHostUrls()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
