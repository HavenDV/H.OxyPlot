#nullable enable

namespace H.OxyPlot;

public static class GridExtensions
{
    #region ColumnsAndRows

    public static readonly DependencyProperty ColumnsAndRowsProperty =
        DependencyProperty.RegisterAttached(
            nameof(ColumnsAndRowsProperty).Replace("Property", string.Empty),
            typeof(string),
            typeof(GridExtensions),
            new PropertyMetadata(string.Empty, OnColumnsAndRowsChanged));

#if HAS_WPF
    [AttachedPropertyBrowsableForType(typeof(Grid))]
#endif
    public static string? GetColumnsAndRows(DependencyObject element)
    {
        element = element ?? throw new ArgumentNullException(nameof(element));

        return (string?)element.GetValue(ColumnsAndRowsProperty);
    }

    public static void SetColumnsAndRows(DependencyObject element, string? value)
    {
        element = element ?? throw new ArgumentNullException(nameof(element));

        element.SetValue(ColumnsAndRowsProperty, value);
    }

    private static void OnColumnsAndRowsChanged(
        DependencyObject element,
        DependencyPropertyChangedEventArgs args)
    {
        if (element is not Grid grid)
        {
            throw new ArgumentException($"Element should be {nameof(Grid)}.");
        }

        if (args.NewValue is not string columnsAndRows)
        {
            throw new ArgumentException($"Value should be {nameof(String)}.");
        }

        grid.ColumnDefinitions.Clear();
        grid.RowDefinitions.Clear();

        if (string.IsNullOrWhiteSpace(columnsAndRows))
        {
            return;
        }

        var values = columnsAndRows.Split(';');
        foreach (var constraint in (values.ElementAtOrDefault(0) ?? "*")
            .Split(',')
            .Select(Constraint.Parse))
        {
            grid.ColumnDefinitions.Add(new ColumnDefinition
            {
                Width = constraint.Value,
                MinWidth = constraint.MinValue,
                MaxWidth = constraint.MaxValue,
            });
        }

        foreach (var constraint in (values.ElementAtOrDefault(1) ?? "*")
            .Split(',')
            .Select(Constraint.Parse))
        {
            grid.RowDefinitions.Add(new RowDefinition
            {
                Height = constraint.Value,
                MinHeight = constraint.MinValue,
                MaxHeight = constraint.MaxValue,
            });
        }
    }

    #endregion

    #region Columns

    public static readonly DependencyProperty ColumnsProperty =
        DependencyProperty.RegisterAttached(
            nameof(ColumnsProperty).Replace("Property", string.Empty),
            typeof(string),
            typeof(GridExtensions),
            new PropertyMetadata(string.Empty, OnColumnsChanged));

#if HAS_WPF
    [AttachedPropertyBrowsableForType(typeof(Grid))]
#endif
    public static string? GetColumns(DependencyObject element)
    {
        element = element ?? throw new ArgumentNullException(nameof(element));

        return (string?)element.GetValue(ColumnsProperty);
    }

    public static void SetColumns(DependencyObject element, string? value)
    {
        element = element ?? throw new ArgumentNullException(nameof(element));

        element.SetValue(ColumnsProperty, value);
    }

    private static void OnColumnsChanged(
        DependencyObject element,
        DependencyPropertyChangedEventArgs args)
    {
        if (element is not Grid)
        {
            throw new ArgumentException($"Element should be {nameof(Grid)}.");
        }

        if (args.NewValue is not string columns)
        {
            throw new ArgumentException($"Value should be {nameof(String)}.");
        }

#if HAS_WPF
        element.SetCurrentValue(ColumnsAndRowsProperty, $"{columns};*");
#else
        element.SetValue(ColumnsAndRowsProperty, $"{columns};*");
#endif
    }

    #endregion

    #region Rows

    public static readonly DependencyProperty RowsProperty =
        DependencyProperty.RegisterAttached(
            nameof(RowsProperty).Replace("Property", string.Empty),
            typeof(string),
            typeof(GridExtensions),
            new PropertyMetadata(string.Empty, OnRowsChanged));

#if HAS_WPF
    [AttachedPropertyBrowsableForType(typeof(Grid))]
#endif
    public static string? GetRows(DependencyObject element)
    {
        element = element ?? throw new ArgumentNullException(nameof(element));

        return (string?)element.GetValue(RowsProperty);
    }

    public static void SetRows(DependencyObject element, string? value)
    {
        element = element ?? throw new ArgumentNullException(nameof(element));

        element.SetValue(RowsProperty, value);
    }

    private static void OnRowsChanged(
        DependencyObject element,
        DependencyPropertyChangedEventArgs args)
    {
        if (element is not Grid)
        {
            throw new ArgumentException($"Element should be {nameof(Grid)}.");
        }

        if (args.NewValue is not string rows)
        {
            throw new ArgumentException($"Value should be {nameof(String)}.");
        }

#if HAS_WPF
        element.SetCurrentValue(ColumnsAndRowsProperty, $"*;{rows}");
#else
        element.SetValue(ColumnsAndRowsProperty, $"*;{rows}");
#endif
    }

    #endregion
}
