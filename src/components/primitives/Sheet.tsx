import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { Pressable, type PressableProps } from 'react-native';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '@/hooks/useTheme';
import { Icon } from '@/components/Icon';

export interface SheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props extends Partial<BottomSheetModalProps> {
  children: React.ReactNode;
  title?: string;
  scroll?: boolean;
  closeIcon?: boolean;
}

const SheetInner = forwardRef<SheetRef, Props>(
  ({ children, title, scroll = false, closeIcon = true, ...rest }, ref) => {
    const theme = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const snapPoints = useMemo(() => ['45%', '80%'], []);
    const activeOffsetY = useMemo(() => [-1, 1] as [number, number], []);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        activeOffsetY={activeOffsetY}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={-1}
            disappearsOnIndex={-1}
            opacity={0.5}
          />
        )}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
        handleStyle={{ backgroundColor: theme.surface1 }}
        backgroundStyle={{ backgroundColor: theme.surface1 }}
        {...rest}
      >
        {closeIcon ? (
          <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Pressable
              onPress={() => sheetRef.current?.dismiss()}
              style={
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                } satisfies PressableProps['style']
              }
            >
              <Icon icon={Cancel01Icon} size={20} color={theme.inkMuted} strokeWidth={2} />
            </Pressable>
          </BottomSheetView>
        ) : null}
        {scroll ? (
          <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={{ padding: 16, paddingBottom: 40 }}>{children}</BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

SheetInner.displayName = 'Sheet';

export const Sheet = SheetInner;
