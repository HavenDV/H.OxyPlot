using OxyPlot;
using OxyPlot.Annotations;
using OxyPlot.Axes;
using OxyPlot.Series;

namespace H.OxyPlot.Apps.ViewModels;

public class MainViewModel
{
    public PlotModel Model { get; private set; } = new PlotModel
    {
        Title = "Hello, World!",
        Axes =
        {
            new LinearAxis { Position = AxisPosition.Bottom },
            new LinearAxis { Position = AxisPosition.Left },
        },
        Series =
        {
            new LineSeries
            {
                Title = "LineSeries",
                MarkerType = MarkerType.Circle,
                Points =
                {
                    new DataPoint(0, 0),
                    new DataPoint(10, 18),
                    new DataPoint(20, 12),
                    new DataPoint(30, 8),
                    new DataPoint(40, 15),
                },
            },
        },
        Annotations =
        {
            new PointAnnotation
            {
                Shape = MarkerType.Circle,
                Text = "H",
                TextColor = OxyColors.LightBlue,
                TextHorizontalAlignment = global::OxyPlot.HorizontalAlignment.Center,
                TextVerticalAlignment = global::OxyPlot.VerticalAlignment.Middle,
                TextMargin = 0,
                TextPosition = new DataPoint(40,0.2),
                FontWeight = global::OxyPlot.FontWeights.Bold,
                Fill = OxyColors.Transparent,
                Stroke = OxyColors.LightBlue,
                StrokeThickness = 2,
                Size = 8.0,
                X = 40,
                Y = 0.2,
            }
        },
    };
}
