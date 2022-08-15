#if HAS_WPF
using System.Globalization;
#endif

#nullable enable

namespace H.OxyPlot.Apps.Converters;

public sealed class NotNullVisibilityConverter : IValueConverter
{
#if HAS_WPF
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
#else
    public object Convert(object? value, Type targetType, object? parameter, string language)
#endif
    {
        return value == null
            ? Visibility.Collapsed
            : Visibility.Visible;
    }

#if HAS_WPF
    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
#else
    public object ConvertBack(object? value, Type targetType, object? parameter, string language)
#endif
    {
        throw new InvalidOperationException();
    }
}
