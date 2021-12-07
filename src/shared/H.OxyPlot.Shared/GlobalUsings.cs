﻿global using Windows.Foundation;
global using Windows.System;

#if HAS_WPF
global using System.Windows;
global using System.Windows.Controls;
#elif HAS_WINUI
global using Windows.UI;
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
#else
global using Windows.UI;
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
#endif