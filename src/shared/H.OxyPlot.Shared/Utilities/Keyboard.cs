// --------------------------------------------------------------------------------------------------------------------
// <copyright file="Keyboard.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// <summary>
//   Provides utility methods related to the keyboard.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

namespace OxyPlot.Utilities
{
    using System.Windows.Input;

    /// <summary>
    /// Provides utility methods related to the keyboard.
    /// </summary>
    internal static class Keyboard
    {
#if HAS_WPF
        /// <summary>
        /// Gets the current modifier keys.
        /// </summary>
        /// <returns>A <see cref="OxyModifierKeys" /> value.</returns>
        public static OxyModifierKeys GetModifierKeys()
        {
            var modifiers = OxyModifierKeys.None;
            if (System.Windows.Input.Keyboard.IsKeyDown(Key.LeftShift) || System.Windows.Input.Keyboard.IsKeyDown(Key.RightShift))
            {
                modifiers |= OxyModifierKeys.Shift;
            }

            if (System.Windows.Input.Keyboard.IsKeyDown(Key.LeftCtrl) || System.Windows.Input.Keyboard.IsKeyDown(Key.RightCtrl))
            {
                modifiers |= OxyModifierKeys.Control;
            }

            if (System.Windows.Input.Keyboard.IsKeyDown(Key.LeftAlt) || System.Windows.Input.Keyboard.IsKeyDown(Key.RightAlt))
            {
                modifiers |= OxyModifierKeys.Alt;
            }

            if (System.Windows.Input.Keyboard.IsKeyDown(Key.LWin) || System.Windows.Input.Keyboard.IsKeyDown(Key.RWin))
            {
                modifiers |= OxyModifierKeys.Windows;
            }

            return modifiers;
        }
#else
        /// <summary>
        /// Gets the modifier keys.
        /// </summary>
        /// <param name="e">The <see cref="PointerRoutedEventArgs" /> instance containing the event data.</param>
        /// <returns>Modifier keys.</returns>
        public static OxyModifierKeys GetModifierKeys(this PointerRoutedEventArgs e)
        {
            var result = OxyModifierKeys.None;
            if ((e.KeyModifiers & VirtualKeyModifiers.Shift) == VirtualKeyModifiers.Shift)
            {
                result |= OxyModifierKeys.Shift;
            }

            if ((e.KeyModifiers & VirtualKeyModifiers.Control) == VirtualKeyModifiers.Control)
            {
                result |= OxyModifierKeys.Control;
            }

            if ((e.KeyModifiers & VirtualKeyModifiers.Menu) == VirtualKeyModifiers.Menu)
            {
                result |= OxyModifierKeys.Alt;
            }

            if ((e.KeyModifiers & VirtualKeyModifiers.Windows) == VirtualKeyModifiers.Windows)
            {
                result |= OxyModifierKeys.Windows;
            }

            return result;
        }
#endif
    }
}
