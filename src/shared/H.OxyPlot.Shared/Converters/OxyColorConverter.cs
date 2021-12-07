// --------------------------------------------------------------------------------------------------------------------
// <copyright file="OxyColorConverter.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// <summary>
//   Converts between <see cref="OxyColor" /> and <see cref="Color" />.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot.Converters
{
    /// <summary>
    /// Converts between <see cref="OxyColor" /> and <see cref="Color" />.
    /// </summary>
#if HAS_WPF
    [ValueConversion(typeof(OxyColor), typeof(Color))]
    [ValueConversion(typeof(OxyColor), typeof(Brush))]
#endif
    public class OxyColorConverter : IValueConverter
    {
        /// <summary>
        /// Converts a value.
        /// </summary>
        /// <param name="value">The value produced by the binding source.</param>
        /// <param name="targetType">The type of the binding target property.</param>
        /// <param name="parameter">The converter parameter to use.</param>
        /// <returns>A converted value. If the method returns <c>null</c>, the valid <c>null</c> value is used.</returns>
#if HAS_WPF
        public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
#else
        public object? Convert(object? value, Type targetType, object? parameter, string language)
#endif
        {
            if (value is OxyColor color)
            {
                if (targetType == typeof(Color))
                {
                    return color.ToColor();
                }

                if (targetType == typeof(Brush))
                {
                    return color.ToBrush();
                }
            }

            return null;
        }

        /// <summary>
        /// Converts a value.
        /// </summary>
        /// <param name="value">The value that is produced by the binding target.</param>
        /// <param name="targetType">The type to convert to.</param>
        /// <param name="parameter">The converter parameter to use.</param>
        /// <param name="language">The culture to use in the converter.</param>
        /// <returns>A converted value. If the method returns <c>null</c>, the valid <c>null</c> value is used.</returns>
#if HAS_WPF
        public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
#else
        public object? ConvertBack(object? value, Type targetType, object? parameter, string language)
#endif
        {
            if (targetType == typeof(OxyColor))
            {
                if (value is Color color)
                {
                    return OxyColor.FromArgb(color.A, color.R, color.G, color.B);
                }

                if (value is SolidColorBrush brush)
                {
                    return OxyColor.FromArgb(brush.Color.A, brush.Color.R, brush.Color.G, brush.Color.B);
                }
            }

            return null;
        }
    }
}
