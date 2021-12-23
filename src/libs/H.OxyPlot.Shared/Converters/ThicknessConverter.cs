// --------------------------------------------------------------------------------------------------------------------
// <copyright file="ThicknessConverter.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// <summary>
//   Converts from <see cref="Thickness" /> to the maximum thicknesses.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

#pragma warning disable CS1591

namespace OxyPlot.Converters;

/// <summary>
/// Converts from Thickness to the maximum thicknesses.
/// </summary>
/// <remarks>This is used in the <see cref="Controls.TrackerControl" /> to convert BorderThickness properties to Path.StrokeThickness (double).
/// The maximum thickness value is used.</remarks>
#if HAS_WPF
[ValueConversion(typeof(Thickness), typeof(double))]
#endif
public class ThicknessConverter : IValueConverter
{
#if HAS_WPF
        public object? Convert(object? value, Type targetType, object parameter, CultureInfo culture)
#else
    public object? Convert(object? value, Type targetType, object parameter, string language)
#endif
    {
        if (value is Thickness t && targetType == typeof(double))
        {
            return Math.Max(Math.Max(t.Left, t.Right), Math.Max(t.Top, t.Bottom));
        }

        return null;
    }

#if HAS_WPF
    public object? ConvertBack(object? value, Type targetType, object parameter, CultureInfo culture)
#else
    public object? ConvertBack(object? value, Type targetType, object parameter, string language)
#endif
    {
        return null;
    }
}
