// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotViewBase.KeyboardEvents.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot;

public abstract partial class PlotViewBase
{
#if !HAS_WPF
    /// <summary>
    /// The state of the Alt key.
    /// </summary>
    private bool isAltPressed;

    /// <summary>
    /// The state of the Windows key.
    /// </summary>
    private bool isWindowsPressed;

    /// <summary>
    /// The state of the Control key.
    /// </summary>
    private bool isControlPressed;

    /// <summary>
    /// The is shift pressed.
    /// </summary>
    private bool isShiftPressed;
#endif

    /// <summary>
    /// Called before the KeyDown event occurs.
    /// </summary>
    /// <param name="e">The data for the event.</param>
#if HAS_WPF
    protected override void OnKeyDown(KeyEventArgs e)
#else
    protected override void OnKeyDown(KeyRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if !HAS_WPF
        switch (e.Key)
        {
            case VirtualKey.Control:
                isControlPressed = true;
                break;
            case VirtualKey.Shift:
                isShiftPressed = true;
                break;
            case VirtualKey.Menu:
                isAltPressed = true;
                break;
            case VirtualKey.LeftWindows:
            case VirtualKey.RightWindows:
                isWindowsPressed = true;
                break;
        }

        var modifiers = OxyModifierKeys.None;
        if (isControlPressed)
        {
            modifiers |= OxyModifierKeys.Control;
        }

        if (isAltPressed)
        {
            modifiers |= OxyModifierKeys.Control;
        }

        if (isShiftPressed)
        {
            modifiers |= OxyModifierKeys.Shift;
        }

        if (isWindowsPressed)
        {
            modifiers |= OxyModifierKeys.Windows;
        }
#endif

        base.OnKeyDown(e);
        if (e.Handled)
        {
            return;
        }

        var args = new OxyKeyEventArgs
        {
            Key = e.Key.Convert(),
#if HAS_WPF
            ModifierKeys = Utilities.Keyboard.GetModifierKeys(),
#else
            ModifierKeys = modifiers,
#endif
        };
        e.Handled = ActualController.HandleKeyDown(this, args);
    }

#if !HAS_WPF
    /// <summary>
    /// Called before the KeyUp event occurs.
    /// </summary>
    /// <param name="e">The data for the event.</param>
    protected override void OnKeyUp(KeyRoutedEventArgs e)
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

        base.OnKeyUp(e);
        switch (e.Key)
        {
            case VirtualKey.Control:
                this.isControlPressed = false;
                break;
            case VirtualKey.Shift:
                this.isShiftPressed = false;
                break;
            case VirtualKey.Menu:
                this.isAltPressed = false;
                break;
            case VirtualKey.LeftWindows:
            case VirtualKey.RightWindows:
                this.isWindowsPressed = false;
                break;
        }
    }
#endif
}
