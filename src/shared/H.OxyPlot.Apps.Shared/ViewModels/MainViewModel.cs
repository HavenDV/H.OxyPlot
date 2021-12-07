using OxyPlot;
using OxyPlot.Axes;
using OxyPlot.Series;

namespace H.OxyPlot.Apps.ViewModels;

public class MainViewModel
{
    public PlotModel Model { get; private set; } = new PlotModel
    {
        Title = "Hello Universal Windows",
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
                }
            },
        }
    };
}
