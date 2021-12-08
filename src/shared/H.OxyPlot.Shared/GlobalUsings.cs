#if HAS_WPF
global using System.Globalization;
global using System.Windows.Data;
global using System.Windows.Media;
global using System.Windows.Input;
global using System.Windows.Shapes;
global using System.Windows;
global using System.Windows.Controls;
global using System.Windows.Threading;
global using System.Windows.Controls.Primitives;
#elif HAS_WINUI
global using Windows.Foundation;
global using Windows.System;
global using Windows.UI;
global using Windows.UI.Core;
global using Microsoft.UI;
global using Microsoft.UI.Xaml;
global using Microsoft.UI.Xaml.Data;
global using Microsoft.UI.Xaml.Media;
global using Microsoft.UI.Xaml.Input;
global using Microsoft.UI.Xaml.Shapes;
global using Microsoft.UI.Xaml.Controls;
global using Microsoft.UI.Xaml.Media.Imaging;
global using Microsoft.UI.Input;
global using Path = Microsoft.UI.Xaml.Shapes.Path;
global using Cursor = Microsoft.UI.Input.InputSystemCursorShape;
global using Cursors = Microsoft.UI.Input.InputSystemCursorShape;
global using CommunityToolkit.WinUI.UI;
#else
global using Windows.Foundation;
global using Windows.System;
global using Windows.UI;
global using Windows.UI.Core;
global using Windows.UI.Input;
global using Windows.UI.Xaml;
global using Windows.UI.Xaml.Data;
global using Windows.UI.Xaml.Media;
global using Windows.UI.Xaml.Input;
global using Windows.UI.Xaml.Shapes;
global using Windows.UI.Xaml.Controls;
global using Windows.UI.Xaml.Media.Imaging;
global using Windows.Devices.Input;
global using Path = Windows.UI.Xaml.Shapes.Path;
global using Cursor = Windows.UI.Core.CoreCursorType;
global using Cursors = Windows.UI.Core.CoreCursorType;
global using Microsoft.Toolkit.Uwp.UI;
#endif

#if HAS_UNO && HAS_WINUI
global using Windows.UI.Input;
global using Windows.Devices.Input;
#endif