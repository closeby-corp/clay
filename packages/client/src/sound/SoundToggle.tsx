import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { applySound, isSoundAvailable, isSoundEnabled, playSound, subscribeSound } from './engine';

/** Corner mute button next to the Clay connection chip. Hidden until the app enables sound. */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundEnabled, () => false);
  const available = useSyncExternalStore(subscribeSound, isSoundAvailable, () => false);
  if (!available) return null;

  const Icon = on ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      data-sound="none"
      aria-pressed={!on}
      aria-label={on ? 'Mute interface sounds' : 'Unmute interface sounds'}
      title={on ? 'Mute sounds' : 'Unmute sounds'}
      onClick={() => {
        applySound({ enabled: !on });
        if (!on) playSound('toggleOn');
      }}
      className={cn(
        'pointer-events-auto flex size-[22px] items-center justify-center rounded-full border border-border bg-background/80 shadow-sm backdrop-blur-sm transition-colors',
        'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
      )}
    >
      <Icon className="size-3" />
    </button>
  );
}
