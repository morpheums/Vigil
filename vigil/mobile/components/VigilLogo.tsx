import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface VigilLogoProps {
  size?: number;
}

export default function VigilLogo({ size = 32 }: VigilLogoProps) {
  const scale = size / 1024;
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Rect width="1024" height="1024" rx="224" fill="#3DFFA0" />
      <Path
        d="M512 192L256 304V544C256 684.8 364.8 816 512 864C659.2 816 768 684.8 768 544V304L512 192Z"
        fill="#080808"
      />
      <Path
        d="M512 240L288 340V544C288 668.8 385.6 784 512 828C638.4 784 736 668.8 736 544V340L512 240Z"
        fill="#0d0d0d"
      />
      <Circle cx="512" cy="556" r="96" fill="#3DFFA0" />
      <Circle cx="512" cy="556" r="64" fill="#080808" />
      <Circle cx="512" cy="556" r="36" fill="#3DFFA0" />
      <Circle cx="512" cy="556" r="18" fill="#080808" />
    </Svg>
  );
}
