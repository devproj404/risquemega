import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VIPBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function VIPBadge({ size = 'md', showText = false }: VIPBadgeProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (showText) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2 py-0.5 rounded-full ${textSizes[size]} font-bold `}>
              <img src="/images/verify.svg" alt="VIP" className={sizeClasses[size]} />
              VIP
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>VIP Member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <img src="/images/verify.svg" alt="VIP" className={`${sizeClasses[size]} `} />
        </TooltipTrigger>
        <TooltipContent>
          <p>VIP Member</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
