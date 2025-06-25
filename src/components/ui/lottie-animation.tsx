import { useRef, useEffect, forwardRef } from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationData: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
  speed?: number;
  lottieRef?: React.RefObject<any>;
  width?: number;
  height?: number;
}

export const LottieAnimation = forwardRef<any, LottieAnimationProps>(({
  animationData,
  loop = false,
  autoplay = false,
  className = '',
  style = {},
  onComplete,
  speed = 1,
  lottieRef: externalRef,
  width,
  height
}, ref) => {
  const internalRef = useRef<any>(null);
  const lottieRef = externalRef || internalRef;

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed, lottieRef]);

  const combinedStyle = {
    ...style,
    ...(width && { width: `${width}px` }),
    ...(height && { height: `${height}px` })
  };

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={combinedStyle}
      onComplete={onComplete}
    />
  );
});

LottieAnimation.displayName = 'LottieAnimation'; 