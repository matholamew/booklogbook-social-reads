import { useState, useRef, useCallback } from 'react';

interface UseAnimationOptions {
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
}

export const useAnimation = (options: UseAnimationOptions = {}) => {
  const { autoplay = false, loop = false, speed = 1 } = options;
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isHovered, setIsHovered] = useState(false);
  const lottieRef = useRef<any>(null);

  const play = useCallback(() => {
    if (lottieRef.current) {
      lottieRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (lottieRef.current) {
      lottieRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (lottieRef.current) {
      lottieRef.current.stop();
      setIsPlaying(false);
    }
  }, []);

  const goToAndPlay = useCallback((frame: number) => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(frame);
      setIsPlaying(true);
    }
  }, []);

  const goToAndStop = useCallback((frame: number) => {
    if (lottieRef.current) {
      lottieRef.current.goToAndStop(frame);
      setIsPlaying(false);
    }
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(newSpeed);
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!isPlaying) {
      play();
    }
  }, [isPlaying, play]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!loop) {
      pause();
    }
  }, [loop, pause]);

  const handleComplete = useCallback(() => {
    if (!loop) {
      setIsPlaying(false);
    }
  }, [loop]);

  return {
    lottieRef,
    isPlaying,
    isHovered,
    play,
    pause,
    stop,
    goToAndPlay,
    goToAndStop,
    setSpeed,
    handleMouseEnter,
    handleMouseLeave,
    handleComplete
  };
}; 