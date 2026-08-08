import { Element } from '@badui/core';

export type ImageCropPayload = {
  dataUrl: string;
};

export type ImageCropProps = {
  src: string;
  aspect?: number;
  className?: string;
  onCrop?: (payload: ImageCropPayload) => void;
};

/**
 * Interactive image cropper. Emits `crop` with a data URL (no upload pipeline).
 */
export function imageCrop(props: ImageCropProps): Element {
  return new Element('imageCrop', {
    src: props.src ?? '',
    aspect: props.aspect,
    className: props.className,
    onCrop: props.onCrop,
  });
}
