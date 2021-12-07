using System.Globalization;

#nullable enable

namespace H.OxyPlot;

/// <summary>
/// https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/GridLengthConverter.cs
/// </summary>
public static class GridLengthConverter
{
    public static GridLength ConvertFromInvariantString(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new GridLength(1, GridUnitType.Star);
        }

        if (text.ToUpperInvariant() is "AUTO" or "A")
        {
            return GridLength.Auto;
        }

        if (text.Contains('*'))
        {
            var value = text.Replace("*", string.Empty);

            return new GridLength(
                string.IsNullOrWhiteSpace(value)
                    ? 1
                    : Convert.ToDouble(value, CultureInfo.InvariantCulture),
                GridUnitType.Star);
        }

        return new GridLength(Convert.ToDouble(text, CultureInfo.InvariantCulture));
    }
}
