// --------------------------------------------------------------------------------------------------------------------
// <copyright file="OxyColorConverter.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// <summary>
//   Converts between <see cref="OxyColor" /> and <see cref="Color" />.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

#pragma warning disable CS1591

namespace OxyPlot.Converters;

/// <summary>
/// Converts between <see cref="OxyColor" /> and Color.
/// </summary>
#if HAS_WPF
[ValueConversion(typeof(OxyColor), typeof(Color))]
[ValueConversion(typeof(OxyColor), typeof(Brush))]
#endif
public class OxyColorConverter : IValueConverter
{
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
