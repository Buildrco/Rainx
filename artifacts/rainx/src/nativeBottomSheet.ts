import * as React from 'react';
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

type NativeSheetAction = {
  type?: 'click' | 'input' | 'change';
  path?: string;
  value?: string | null;
};

type NativeBottomSheetPlugin = {
  present(options: { html: string; baseUrl: string }): Promise<void>;
  update(options: { html: string; baseUrl: string }): Promise<void>;
  dismiss(): Promise<void>;
  addListener(event: 'action' | 'dismissed', listener: (payload: NativeSheetAction) => void): Promise<PluginListenerHandle>;
};

export const NativeBottomSheet = registerPlugin<NativeBottomSheetPlugin>('NativeBottomSheet');

export const isAndroidNative = () => Capacitor.getPlatform() === 'android';

function markInteractiveNodes(root: HTMLElement) {
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>(
    'button,a,input,textarea,select,[role="button"],[data-sheet-handle]'
  ))];
  nodes.forEach((node, index) => {
    node.dataset.rainxNativeNode = String(index);
  });
}

function copyLiveValues(source: HTMLElement, clone: HTMLElement) {
  const sourceFields = Array.from(source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'));
  const cloneFields = Array.from(clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'));
  sourceFields.forEach((field, index) => {
    const cloneField = cloneFields[index];
    if (!cloneField) return;
    if (field instanceof HTMLTextAreaElement) cloneField.textContent = field.value;
    else if (field instanceof HTMLSelectElement) cloneField.value = field.value;
    else {
      cloneField.value = field.value;
      cloneField.checked = field.checked;
    }
  });
}

function sheetCss() {
  const rules: string[] = [];
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      rules.push(Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('\n'));
    } catch {
      // Cross-origin stylesheets cannot be read; inline styles still preserve the UI.
    }
  }
  return rules.join('\n');
}

function serializeSheet(root: HTMLElement) {
  markInteractiveNodes(root);
  const clone = root.cloneNode(true) as HTMLElement;
  copyLiveValues(root, clone);

  // The Android dialog owns positioning and drag physics. Remove web positioning
  // from the cloned sheet so CSS cannot fight BottomSheetBehavior.
  clone.style.position = 'static';
  clone.style.inset = 'auto';
  clone.style.top = 'auto';
  clone.style.right = 'auto';
  clone.style.bottom = 'auto';
  clone.style.left = 'auto';
  clone.style.transform = 'none';
  clone.style.animation = 'none';
  clone.style.boxSizing = 'border-box';
  clone.style.width = '100%';
  clone.style.height = 'auto';
  clone.style.minHeight = '0';
  clone.style.maxHeight = '92vh';
  clone.style.overflowY = 'auto';
  clone.style.overflowX = 'hidden';
  clone.style.scrollBehavior = 'auto';
  clone.style.margin = '0';

  const handle = clone.querySelector('[data-sheet-handle]');
  if (handle && handle.parentElement) {
    handle.parentElement.style.position = 'sticky';
    handle.parentElement.style.top = '0';
    handle.parentElement.style.zIndex = '20';
    handle.parentElement.style.background = 'inherit';
  }
  clone.className = clone.className
    .split(/\s+/)
    .filter((token) => !/^(fixed|inset-|top-|right-|bottom-|left-|translate-|animate-|slide-)/.test(token))
    .join(' ');

  return '<style>' + sheetCss() + '</style>' + clone.outerHTML;
}

function findNativeNode(root: HTMLElement, path?: string) {
  if (!path) return null;
  return [root, ...Array.from(root.querySelectorAll<HTMLElement>('[data-rainx-native-node]'))]
    .find((node) => node.dataset.rainxNativeNode === path) || null;
}

function setNativeFieldValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string | null | undefined) {
  if (value == null) return;
  const prototype = Object.getPrototypeOf(element) as { value?: unknown };
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function useNativeBottomSheet(
  sheetRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss?: () => void,
) {
  const [nativeOpen, setNativeOpen] = React.useState(false);
  const mountedRef = React.useRef(true);
  const onDismissRef = React.useRef(onDismiss);

  React.useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  React.useEffect(() => {
    mountedRef.current = true;
    if (!enabled || !isAndroidNative() || !sheetRef.current) return undefined;

    const root = sheetRef.current;
    let actionHandle: PluginListenerHandle | undefined;
    let dismissedHandle: PluginListenerHandle | undefined;
    let active = false;

    const restoreWebSheet = () => {
      root.style.visibility = '';
      root.style.pointerEvents = '';
      if (mountedRef.current) setNativeOpen(false);
    };

    const onAction = (payload: NativeSheetAction) => {
      const node = findNativeNode(root, payload.path);
      if (!node) return;
      if (payload.type === 'click' && node instanceof HTMLElement) node.click();
      if ((payload.type === 'input' || payload.type === 'change') && node instanceof HTMLInputElement) {
        setNativeFieldValue(node, payload.value);
      } else if ((payload.type === 'input' || payload.type === 'change') && node instanceof HTMLTextAreaElement) {
        setNativeFieldValue(node, payload.value);
      } else if ((payload.type === 'input' || payload.type === 'change') && node instanceof HTMLSelectElement) {
        setNativeFieldValue(node, payload.value);
      }
      // Input events are already reflected in the native WebView. Reloading the
      // document for every keystroke destroys focus and reopens the keyboard.
      // Clicks and non-text changes represent React state transitions, so those
      // are safe points to synchronize the snapshot.
      if (payload.type === 'input') return;
      window.setTimeout(() => {
        if (active && sheetRef.current) {
          void NativeBottomSheet.update({
            html: serializeSheet(sheetRef.current),
            baseUrl: window.location.origin + '/',
          }).catch((error) => {
            if (import.meta.env.DEV) console.error('[RainX] NativeBottomSheet update failed', error);
          });
        }
      }, 50);
    };

    const onDismissed = () => {
      if (!active) return;
      active = false;
      restoreWebSheet();
      const close = (sheetRef.current || root).querySelector<HTMLElement>('[data-rainx-native-close]');
      if (close) close.click();
      else onDismissRef.current?.();
    };

    const present = async () => {
      try {
        actionHandle = await NativeBottomSheet.addListener('action', onAction);
        dismissedHandle = await NativeBottomSheet.addListener('dismissed', onDismissed);
        // Hide the web implementation before the dialog starts animating. If
        // the plugin is unavailable, the catch block restores the fallback.
        setNativeOpen(true);
        root.style.visibility = 'hidden';
        root.style.pointerEvents = 'none';
        active = true;
        await NativeBottomSheet.present({ html: serializeSheet(root), baseUrl: window.location.origin + '/' });
        if (!mountedRef.current) return;
      } catch (error) {
        console.error('[RainX] NativeBottomSheet is unavailable; using the web fallback.', error);
        active = false;
        restoreWebSheet();
      }
    };

    void present();
    return () => {
      mountedRef.current = false;
      active = false;
      void actionHandle?.remove();
      void dismissedHandle?.remove();
      root.style.visibility = '';
      root.style.pointerEvents = '';
      void NativeBottomSheet.dismiss().catch(() => undefined);
    };
  }, [enabled, sheetRef]);

  return nativeOpen;
}
