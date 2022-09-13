var Uno;
(function (Uno) {
    var Utils;
    (function (Utils) {
        class Clipboard {
            static startContentChanged() {
                ['cut', 'copy', 'paste'].forEach(function (event) {
                    document.addEventListener(event, Clipboard.onClipboardChanged);
                });
            }
            static stopContentChanged() {
                ['cut', 'copy', 'paste'].forEach(function (event) {
                    document.removeEventListener(event, Clipboard.onClipboardChanged);
                });
            }
            static setText(text) {
                const nav = navigator;
                if (nav.clipboard) {
                    // Use clipboard object when available
                    nav.clipboard.writeText(text);
                    // Trigger change notification, as clipboard API does
                    // not execute "copy".
                    Clipboard.onClipboardChanged();
                }
                else {
                    // Hack when the clipboard is not available
                    const textarea = document.createElement("textarea");
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                }
                return "ok";
            }
            static getText() {
                const nav = navigator;
                if (nav.clipboard) {
                    return nav.clipboard.readText();
                }
                return Promise.resolve(null);
            }
            static onClipboardChanged() {
                if (!Clipboard.dispatchContentChanged) {
                    Clipboard.dispatchContentChanged =
                        Module.mono_bind_static_method("[Uno] Windows.ApplicationModel.DataTransfer.Clipboard:DispatchContentChanged");
                }
                Clipboard.dispatchContentChanged();
            }
        }
        Utils.Clipboard = Clipboard;
    })(Utils = Uno.Utils || (Uno.Utils = {}));
})(Uno || (Uno = {}));
var Windows;
(function (Windows) {
    var UI;
    (function (UI) {
        var Core;
        (function (Core) {
            /**
             * Support file for the Windows.UI.Core
             * */
            class CoreDispatcher {
                static init(isReady) {
                    MonoSupport.jsCallDispatcher.registerScope("CoreDispatcher", Windows.UI.Core.CoreDispatcher);
                    CoreDispatcher.initMethods();
                    CoreDispatcher._isReady = isReady;
                }
                /**
                 * Enqueues a core dispatcher callback on the javascript's event loop
                 *
                 * */
                static WakeUp() {
                    // Is there a Ready promise ?
                    if (CoreDispatcher._isReady) {
                        // Are we already waiting for a Ready promise ?
                        if (!CoreDispatcher._isWaitingReady) {
                            CoreDispatcher._isReady
                                .then(() => {
                                CoreDispatcher.InnerWakeUp();
                                CoreDispatcher._isReady = null;
                            });
                            CoreDispatcher._isWaitingReady = true;
                        }
                    }
                    else {
                        CoreDispatcher.InnerWakeUp();
                    }
                    return true;
                }
                static InnerWakeUp() {
                    window.setImmediate(() => {
                        try {
                            CoreDispatcher._coreDispatcherCallback();
                        }
                        catch (e) {
                            console.error(`Unhandled dispatcher exception: ${e} (${e.stack})`);
                            throw e;
                        }
                    });
                }
                static initMethods() {
                    if (Uno.UI.WindowManager.isHosted) {
                        console.debug("Hosted Mode: Skipping CoreDispatcher initialization ");
                    }
                    else {
                        if (!CoreDispatcher._coreDispatcherCallback) {
                            CoreDispatcher._coreDispatcherCallback = Module.mono_bind_static_method("[Uno.UI.Dispatching] Uno.UI.Dispatching.CoreDispatcher:DispatcherCallback");
                        }
                    }
                }
            }
            CoreDispatcher._isFirstCall = true;
            Core.CoreDispatcher = CoreDispatcher;
        })(Core = UI.Core || (UI.Core = {}));
    })(UI = Windows.UI || (Windows.UI = {}));
})(Windows || (Windows = {}));
var Uno;
(function (Uno) {
    var Utils;
    (function (Utils) {
        class Guid {
            static NewGuid() {
                if (!Guid.newGuidMethod) {
                    Guid.newGuidMethod = Module.mono_bind_static_method("[mscorlib] System.Guid:NewGuid");
                }
                return Guid.newGuidMethod();
            }
        }
        Utils.Guid = Guid;
    })(Utils = Uno.Utils || (Uno.Utils = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var UI;
    (function (UI) {
        class HtmlDom {
            /**
             * Initialize various polyfills used by Uno
             */
            static initPolyfills() {
                this.isConnectedPolyfill();
            }
            static isConnectedPolyfill() {
                function get() {
                    // polyfill implementation
                    return document.contains(this);
                }
                (supported => {
                    if (!supported) {
                        Object.defineProperty(Node.prototype, "isConnected", { get });
                    }
                })("isConnected" in Node.prototype);
            }
        }
        UI.HtmlDom = HtmlDom;
    })(UI = Uno.UI || (Uno.UI = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var UI;
    (function (UI) {
        let HtmlEventDispatchResult;
        (function (HtmlEventDispatchResult) {
            HtmlEventDispatchResult[HtmlEventDispatchResult["Ok"] = 0] = "Ok";
            HtmlEventDispatchResult[HtmlEventDispatchResult["StopPropagation"] = 1] = "StopPropagation";
            HtmlEventDispatchResult[HtmlEventDispatchResult["PreventDefault"] = 2] = "PreventDefault";
            HtmlEventDispatchResult[HtmlEventDispatchResult["NotDispatched"] = 128] = "NotDispatched";
        })(HtmlEventDispatchResult = UI.HtmlEventDispatchResult || (UI.HtmlEventDispatchResult = {}));
    })(UI = Uno.UI || (Uno.UI = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Http;
    (function (Http) {
        class HttpClient {
            static async send(config) {
                const params = {
                    method: config.method,
                    cache: config.cacheMode || "default",
                    headers: new Headers(config.headers)
                };
                if (config.payload) {
                    params.body = await this.blobFromBase64(config.payload, config.payloadType);
                }
                try {
                    const response = await fetch(config.url, params);
                    let responseHeaders = "";
                    response.headers.forEach((v, k) => responseHeaders += `${k}:${v}\n`);
                    const responseBlob = await response.blob();
                    const responsePayload = responseBlob ? await this.base64FromBlob(responseBlob) : "";
                    this.dispatchResponse(config.id, response.status, responseHeaders, responsePayload);
                }
                catch (error) {
                    this.dispatchError(config.id, `${error.message || error}`);
                    console.error(error);
                }
            }
            static async blobFromBase64(base64, contentType) {
                contentType = contentType || "application/octet-stream";
                const url = `data:${contentType};base64,${base64}`;
                return await (await fetch(url)).blob();
            }
            static base64FromBlob(blob) {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const dataUrl = reader.result;
                        const base64 = dataUrl.split(",", 2)[1];
                        resolve(base64);
                    };
                    reader.readAsDataURL(blob);
                });
            }
            static dispatchResponse(requestId, status, headers, payload) {
                this.initMethods();
                const requestIdStr = MonoRuntime.mono_string(requestId);
                const statusStr = MonoRuntime.mono_string("" + status);
                const headersStr = MonoRuntime.mono_string(headers);
                const payloadStr = MonoRuntime.mono_string(payload);
                MonoRuntime.call_method(this.dispatchResponseMethod, null, [requestIdStr, statusStr, headersStr, payloadStr]);
            }
            static dispatchError(requestId, error) {
                this.initMethods();
                const requestIdStr = MonoRuntime.mono_string(requestId);
                const errorStr = MonoRuntime.mono_string(error);
                MonoRuntime.call_method(this.dispatchErrorMethod, null, [requestIdStr, errorStr]);
            }
            static initMethods() {
                if (this.dispatchResponseMethod) {
                    return; // already initialized.
                }
                const asm = MonoRuntime.assembly_load("Uno.UI.Runtime.WebAssembly");
                const httpClass = MonoRuntime.find_class(asm, "Uno.UI.Wasm", "WasmHttpHandler");
                this.dispatchResponseMethod = MonoRuntime.find_method(httpClass, "DispatchResponse", -1);
                this.dispatchErrorMethod = MonoRuntime.find_method(httpClass, "DispatchError", -1);
            }
        }
        Http.HttpClient = HttpClient;
    })(Http = Uno.Http || (Uno.Http = {}));
})(Uno || (Uno = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace
var MonoSupport;
(function (MonoSupport) {
    /**
     * This class is used by https://github.com/mono/mono/blob/fa726d3ac7153d87ed187abd422faa4877f85bb5/sdks/wasm/dotnet_support.js#L88 to perform
     * unmarshaled invocation of javascript from .NET code.
     * */
    class jsCallDispatcher {
        /**
         * Registers a instance for a specified identier
         * @param identifier the scope name
         * @param instance the instance to use for the scope
         */
        static registerScope(identifier, instance) {
            jsCallDispatcher.registrations.set(identifier, instance);
        }
        static findJSFunction(identifier) {
            if (!identifier) {
                return jsCallDispatcher.dispatch;
            }
            else {
                if (!jsCallDispatcher._isUnoRegistered) {
                    jsCallDispatcher.registerScope("UnoStatic", Uno.UI.WindowManager);
                    jsCallDispatcher.registerScope("UnoStatic_Windows_Storage_StorageFolder", Windows.Storage.StorageFolder);
                    jsCallDispatcher.registerScope("UnoStatic_Windows_Storage_ApplicationDataContainer", Windows.Storage.ApplicationDataContainer);
                    jsCallDispatcher.registerScope("UnoStatic_Windows_ApplicationModel_DataTransfer_DragDrop_Core_DragDropExtension", Windows.ApplicationModel.DataTransfer.DragDrop.Core.DragDropExtension);
                    jsCallDispatcher.registerScope("UnoStatic_Windows_UI_Xaml_UIElement", Microsoft.UI.Xaml.UIElement);
                    jsCallDispatcher._isUnoRegistered = true;
                }
                const { ns, methodName } = jsCallDispatcher.parseIdentifier(identifier);
                var instance = jsCallDispatcher.registrations.get(ns);
                if (instance) {
                    var boundMethod = instance[methodName].bind(instance);
                    var methodId = jsCallDispatcher.cacheMethod(boundMethod);
                    return () => methodId;
                }
                else {
                    throw `Unknown scope ${ns}`;
                }
            }
        }
        /**
         * Internal dispatcher for methods invoked through TSInteropMarshaller
         * @param id The method ID obtained when invoking WebAssemblyRuntime.InvokeJSUnmarshalled with a method name
         * @param pParams The parameters structure ID
         * @param pRet The pointer to the return value structure
         */
        static dispatch(id, pParams, pRet) {
            return jsCallDispatcher.methodMap[id + ""](pParams, pRet);
        }
        /**
         * Parses the method identifier
         * @param identifier
         */
        static parseIdentifier(identifier) {
            var parts = identifier.split(':');
            const ns = parts[0];
            const methodName = parts[1];
            return { ns, methodName };
        }
        /**
         * Adds the a resolved method for a given identifier
         * @param identifier the findJSFunction identifier
         * @param boundMethod the method to call
         */
        static cacheMethod(boundMethod) {
            var methodId = Object.keys(jsCallDispatcher.methodMap).length;
            jsCallDispatcher.methodMap[methodId + ""] = boundMethod;
            return methodId;
        }
        static getMethodMapId(methodHandle) {
            return methodHandle + "";
        }
        static invokeOnMainThread() {
            if (!jsCallDispatcher.dispatcherCallback) {
                jsCallDispatcher.dispatcherCallback = Module.mono_bind_static_method("[Uno.UI.Dispatching] Uno.UI.Dispatching.CoreDispatcher:DispatcherCallback");
            }
            // Use setImmediate to return avoid blocking the background thread
            // on a sync call.
            window.setImmediate(() => {
                try {
                    jsCallDispatcher.dispatcherCallback();
                }
                catch (e) {
                    console.error(`Unhandled dispatcher exception: ${e} (${e.stack})`);
                    throw e;
                }
            });
        }
    }
    jsCallDispatcher.registrations = new Map();
    jsCallDispatcher.methodMap = {};
    MonoSupport.jsCallDispatcher = jsCallDispatcher;
})(MonoSupport || (MonoSupport = {}));
// Export the DotNet helper for WebAssembly.JSInterop.InvokeJSUnmarshalled
window.DotNet = MonoSupport;
// Export the main thread invoker for threading support
MonoSupport.invokeOnMainThread = MonoSupport.jsCallDispatcher.invokeOnMainThread;
// eslint-disable-next-line @typescript-eslint/no-namespace
var Uno;
(function (Uno) {
    var UI;
    (function (UI) {
        class WindowManager {
            constructor(containerElementId, loadingElementId) {
                this.containerElementId = containerElementId;
                this.loadingElementId = loadingElementId;
                this.allActiveElementsById = {};
                this.uiElementRegistrations = {};
                this.initDom();
            }
            /**
             * Defines if the WindowManager is running in hosted mode, and should skip the
             * initialization of WebAssembly, use this mode in conjunction with the Uno.UI.WpfHost
             * to improve debuggability.
             */
            static get isHosted() {
                return WindowManager._isHosted;
            }
            /**
             * Defines if the WindowManager is responsible to raise the loading, loaded and unloaded events,
             * or if they are raised directly by the managed code to reduce interop.
             */
            static get isLoadEventsEnabled() {
                return WindowManager._isLoadEventsEnabled;
            }
            /**
                * Initialize the WindowManager
                * @param containerElementId The ID of the container element for the Xaml UI
                * @param loadingElementId The ID of the loading element to remove once ready
                */
            static init(isHosted, isLoadEventsEnabled, containerElementId = "uno-body", loadingElementId = "uno-loading") {
                WindowManager._isHosted = isHosted;
                WindowManager._isLoadEventsEnabled = isLoadEventsEnabled;
                Windows.UI.Core.CoreDispatcher.init(WindowManager.buildReadyPromise());
                this.current = new WindowManager(containerElementId, loadingElementId);
                MonoSupport.jsCallDispatcher.registerScope("Uno", this.current);
                this.current.init();
                return "ok";
            }
            /**
             * Builds a promise that will signal the ability for the dispatcher
             * to initiate work.
             * */
            static buildReadyPromise() {
                return new Promise(resolve => {
                    Promise.all([WindowManager.buildSplashScreen()]).then(() => resolve(true));
                });
            }
            /**
             * Build the splashscreen image eagerly
             * */
            static buildSplashScreen() {
                return new Promise(resolve => {
                    const img = new Image();
                    let loaded = false;
                    let loadingDone = () => {
                        if (!loaded) {
                            loaded = true;
                            if (img.width !== 0 && img.height !== 0) {
                                // Materialize the image content so it shows immediately
                                // even if the dispatcher is blocked thereafter by all
                                // the Uno initialization work. The resulting canvas is not used.
                                //
                                // If the image fails to load, setup the splashScreen anyways with the
                                // proper sample.
                                let canvas = document.createElement("canvas");
                                canvas.width = img.width;
                                canvas.height = img.height;
                                let ctx = canvas.getContext("2d");
                                ctx.drawImage(img, 0, 0);
                            }
                            if (document.readyState === "loading") {
                                document.addEventListener("DOMContentLoaded", () => {
                                    WindowManager.setupSplashScreen(img);
                                    resolve(true);
                                });
                            }
                            else {
                                WindowManager.setupSplashScreen(img);
                                resolve(true);
                            }
                        }
                    };
                    // Preload the splash screen so the image element
                    // created later on 
                    img.onload = loadingDone;
                    img.onerror = loadingDone;
                    const UNO_BOOTSTRAP_APP_BASE = config.environmentVariables["UNO_BOOTSTRAP_APP_BASE"] || "";
                    const UNO_BOOTSTRAP_WEBAPP_BASE_PATH = config.environmentVariables["UNO_BOOTSTRAP_WEBAPP_BASE_PATH"] || "";
                    let fullImagePath = String(UnoAppManifest.splashScreenImage);
                    // If the splashScreenImage image already points to the app base path, use it, otherwise we build it.
                    if (UNO_BOOTSTRAP_APP_BASE !== "" && fullImagePath.indexOf(UNO_BOOTSTRAP_APP_BASE) == -1) {
                        fullImagePath = `${UNO_BOOTSTRAP_WEBAPP_BASE_PATH}${UNO_BOOTSTRAP_APP_BASE}/${UnoAppManifest.splashScreenImage}`;
                    }
                    img.src = fullImagePath;
                    // If there's no response, skip the loading
                    setTimeout(loadingDone, 2000);
                });
            }
            /**
                * Initialize the WindowManager
                * @param containerElementId The ID of the container element for the Xaml UI
                * @param loadingElementId The ID of the loading element to remove once ready
                */
            static initNative(pParams) {
                const params = WindowManagerInitParams.unmarshal(pParams);
                WindowManager.init(params.IsHostedMode, params.IsLoadEventsEnabled);
                return true;
            }
            /**
                * Creates the UWP-compatible splash screen
                *
                */
            static setupSplashScreen(splashImage) {
                if (UnoAppManifest && UnoAppManifest.splashScreenImage) {
                    const loading = document.getElementById("loading");
                    if (loading) {
                        loading.remove();
                    }
                    const unoBody = document.getElementById("uno-body");
                    if (unoBody) {
                        const unoLoading = document.createElement("div");
                        unoLoading.id = "uno-loading";
                        if (UnoAppManifest.splashScreenColor) {
                            const body = document.getElementsByTagName("body")[0];
                            body.style.backgroundColor = UnoAppManifest.splashScreenColor;
                        }
                        splashImage.id = "uno-loading-splash";
                        splashImage.classList.add("uno-splash");
                        unoLoading.appendChild(splashImage);
                        unoBody.appendChild(unoLoading);
                    }
                }
            }
            /**
                * Reads the window's search parameters
                *
                */
            static findLaunchArguments() {
                if (typeof URLSearchParams === "function") {
                    return new URLSearchParams(window.location.search).toString();
                }
                else {
                    const queryIndex = document.location.search.indexOf("?");
                    if (queryIndex !== -1) {
                        return document.location.search.substring(queryIndex + 1);
                    }
                    return "";
                }
            }
            /**
                * Create a html DOM element representing a Xaml element.
                *
                * You need to call addView to connect it to the DOM.
                */
            createContent(contentDefinition) {
                this.createContentInternal(contentDefinition);
                return "ok";
            }
            /**
                * Create a html DOM element representing a Xaml element.
                *
                * You need to call addView to connect it to the DOM.
                */
            createContentNative(pParams) {
                const params = WindowManagerCreateContentParams.unmarshal(pParams);
                const def = {
                    id: this.handleToString(params.HtmlId),
                    handle: params.Handle,
                    isFocusable: params.IsFocusable,
                    isSvg: params.IsSvg,
                    tagName: params.TagName,
                    uiElementRegistrationId: params.UIElementRegistrationId,
                };
                this.createContentInternal(def);
                return true;
            }
            createContentInternal(contentDefinition) {
                // Create the HTML element
                const element = contentDefinition.isSvg
                    ? document.createElementNS("http://www.w3.org/2000/svg", contentDefinition.tagName)
                    : document.createElement(contentDefinition.tagName);
                element.id = contentDefinition.id;
                const uiElementRegistration = this.uiElementRegistrations[this.handleToString(contentDefinition.uiElementRegistrationId)];
                if (!uiElementRegistration) {
                    throw `UIElement registration id ${contentDefinition.uiElementRegistrationId} is unknown.`;
                }
                element.setAttribute("XamlType", uiElementRegistration.typeName);
                element.setAttribute("XamlHandle", this.handleToString(contentDefinition.handle));
                if (uiElementRegistration.isFrameworkElement) {
                    this.setAsUnarranged(element, true);
                }
                if (element.hasOwnProperty("tabindex")) {
                    element["tabindex"] = contentDefinition.isFocusable ? 0 : -1;
                }
                else {
                    element.setAttribute("tabindex", contentDefinition.isFocusable ? "0" : "-1");
                }
                if (contentDefinition) {
                    let classes = element.classList.value;
                    for (const className of uiElementRegistration.classNames) {
                        classes += " uno-" + className;
                    }
                    element.classList.value = classes;
                }
                // Add the html element to list of elements
                this.allActiveElementsById[contentDefinition.id] = element;
            }
            registerUIElement(typeName, isFrameworkElement, classNames) {
                const registrationId = Object.keys(this.uiElementRegistrations).length;
                this.uiElementRegistrations[this.handleToString(registrationId)] = {
                    classNames: classNames,
                    isFrameworkElement: isFrameworkElement,
                    typeName: typeName,
                };
                return registrationId;
            }
            registerUIElementNative(pParams, pReturn) {
                const params = WindowManagerRegisterUIElementParams.unmarshal(pParams);
                const registrationId = this.registerUIElement(params.TypeName, params.IsFrameworkElement, params.Classes);
                const ret = new WindowManagerRegisterUIElementReturn();
                ret.RegistrationId = registrationId;
                ret.marshal(pReturn);
                return true;
            }
            getView(elementHandle) {
                const element = this.allActiveElementsById[this.handleToString(elementHandle)];
                if (!element) {
                    throw `Element id ${elementHandle} not found.`;
                }
                return element;
            }
            /**
                * Set a name for an element.
                *
                * This is mostly for diagnostic purposes.
                */
            setName(elementId, name) {
                this.setNameInternal(elementId, name);
                return "ok";
            }
            /**
                * Set a name for an element.
                *
                * This is mostly for diagnostic purposes.
                */
            setNameNative(pParam) {
                const params = WindowManagerSetNameParams.unmarshal(pParam);
                this.setNameInternal(params.HtmlId, params.Name);
                return true;
            }
            setNameInternal(elementId, name) {
                this.getView(elementId).setAttribute("xamlname", name);
            }
            /**
                * Set a name for an element.
                *
                * This is mostly for diagnostic purposes.
                */
            setXUid(elementId, name) {
                this.setXUidInternal(elementId, name);
                return "ok";
            }
            /**
                * Set a name for an element.
                *
                * This is mostly for diagnostic purposes.
                */
            setXUidNative(pParam) {
                const params = WindowManagerSetXUidParams.unmarshal(pParam);
                this.setXUidInternal(params.HtmlId, params.Uid);
                return true;
            }
            setXUidInternal(elementId, name) {
                this.getView(elementId).setAttribute("xuid", name);
            }
            /**
                * Sets the visibility of the specified element
                */
            setVisibility(elementId, visible) {
                this.setVisibilityInternal(elementId, visible);
                return "ok";
            }
            setVisibilityNative(pParam) {
                const params = WindowManagerSetVisibilityParams.unmarshal(pParam);
                this.setVisibilityInternal(params.HtmlId, params.Visible);
                return true;
            }
            setVisibilityInternal(elementId, visible) {
                const element = this.getView(elementId);
                if (visible) {
                    element.classList.remove(WindowManager.unoCollapsedClassName);
                }
                else {
                    element.classList.add(WindowManager.unoCollapsedClassName);
                }
            }
            /**
                * Set an attribute for an element.
                */
            setAttributes(elementId, attributes) {
                const element = this.getView(elementId);
                for (const name in attributes) {
                    if (attributes.hasOwnProperty(name)) {
                        element.setAttribute(name, attributes[name]);
                    }
                }
                return "ok";
            }
            /**
                * Set an attribute for an element.
                */
            setAttributesNative(pParams) {
                const params = WindowManagerSetAttributesParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                for (let i = 0; i < params.Pairs_Length; i += 2) {
                    element.setAttribute(params.Pairs[i], params.Pairs[i + 1]);
                }
                return true;
            }
            /**
                * Set an attribute for an element.
                */
            setAttributeNative(pParams) {
                const params = WindowManagerSetAttributeParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                element.setAttribute(params.Name, params.Value);
                return true;
            }
            /**
                * Removes an attribute for an element.
                */
            removeAttribute(elementId, name) {
                const element = this.getView(elementId);
                element.removeAttribute(name);
                return "ok";
            }
            /**
                * Removes an attribute for an element.
                */
            removeAttributeNative(pParams) {
                const params = WindowManagerRemoveAttributeParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                element.removeAttribute(params.Name);
                return true;
            }
            /**
                * Get an attribute for an element.
                */
            getAttribute(elementId, name) {
                return this.getView(elementId).getAttribute(name);
            }
            /**
                * Set a property for an element.
                */
            setProperty(elementId, properties) {
                const element = this.getView(elementId);
                for (const name in properties) {
                    if (properties.hasOwnProperty(name)) {
                        const setVal = properties[name];
                        if (setVal === "true") {
                            element[name] = true;
                        }
                        else if (setVal === "false") {
                            element[name] = false;
                        }
                        else {
                            element[name] = setVal;
                        }
                    }
                }
                return "ok";
            }
            /**
                * Set a property for an element.
                */
            setPropertyNative(pParams) {
                const params = WindowManagerSetPropertyParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                for (let i = 0; i < params.Pairs_Length; i += 2) {
                    const setVal = params.Pairs[i + 1];
                    if (setVal === "true") {
                        element[params.Pairs[i]] = true;
                    }
                    else if (setVal === "false") {
                        element[params.Pairs[i]] = false;
                    }
                    else {
                        element[params.Pairs[i]] = setVal;
                    }
                }
                return true;
            }
            /**
                * Get a property for an element.
                */
            getProperty(elementId, name) {
                const element = this.getView(elementId);
                return element[name] || "";
            }
            /**
                * Set the CSS style of a html element.
                *
                * To remove a value, set it to empty string.
                * @param styles A dictionary of styles to apply on html element.
                */
            setStyle(elementId, styles) {
                const element = this.getView(elementId);
                for (const style in styles) {
                    if (styles.hasOwnProperty(style)) {
                        element.style.setProperty(style, styles[style]);
                    }
                }
                return "ok";
            }
            /**
            * Set the CSS style of a html element.
            *
            * To remove a value, set it to empty string.
            * @param styles A dictionary of styles to apply on html element.
            */
            setStyleNative(pParams) {
                const params = WindowManagerSetStylesParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                const elementStyle = element.style;
                const pairs = params.Pairs;
                for (let i = 0; i < params.Pairs_Length; i += 2) {
                    const key = pairs[i];
                    const value = pairs[i + 1];
                    elementStyle.setProperty(key, value);
                }
                return true;
            }
            /**
            * Set a single CSS style of a html element
            *
            */
            setStyleDoubleNative(pParams) {
                const params = WindowManagerSetStyleDoubleParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                element.style.setProperty(params.Name, this.handleToString(params.Value));
                return true;
            }
            setArrangeProperties(elementId) {
                const element = this.getView(elementId);
                this.setAsArranged(element);
                return "ok";
            }
            /**
                * Remove the CSS style of a html element.
                */
            resetStyle(elementId, names) {
                this.resetStyleInternal(elementId, names);
                return "ok";
            }
            /**
                * Remove the CSS style of a html element.
                */
            resetStyleNative(pParams) {
                const params = WindowManagerResetStyleParams.unmarshal(pParams);
                this.resetStyleInternal(params.HtmlId, params.Styles);
                return true;
            }
            resetStyleInternal(elementId, names) {
                const element = this.getView(elementId);
                for (const name of names) {
                    element.style.setProperty(name, "");
                }
            }
            isCssPropertySupported(propertyName, value) {
                return CSS.supports(propertyName, value);
            }
            isCssConditionSupported(supportCondition) {
                return CSS.supports(supportCondition);
            }
            /**
             * Set + Unset CSS classes on an element
             */
            setUnsetClasses(elementId, cssClassesToSet, cssClassesToUnset) {
                const element = this.getView(elementId);
                if (cssClassesToSet) {
                    cssClassesToSet.forEach(c => {
                        element.classList.add(c);
                    });
                }
                if (cssClassesToUnset) {
                    cssClassesToUnset.forEach(c => {
                        element.classList.remove(c);
                    });
                }
            }
            setUnsetClassesNative(pParams) {
                const params = WindowManagerSetUnsetClassesParams.unmarshal(pParams);
                this.setUnsetClasses(params.HtmlId, params.CssClassesToSet, params.CssClassesToUnset);
                return true;
            }
            /**
             * Set CSS classes on an element from a specified list
             */
            setClasses(elementId, cssClassesList, classIndex) {
                const element = this.getView(elementId);
                for (let i = 0; i < cssClassesList.length; i++) {
                    if (i === classIndex) {
                        element.classList.add(cssClassesList[i]);
                    }
                    else {
                        element.classList.remove(cssClassesList[i]);
                    }
                }
                return "ok";
            }
            setClassesNative(pParams) {
                const params = WindowManagerSetClassesParams.unmarshal(pParams);
                this.setClasses(params.HtmlId, params.CssClasses, params.Index);
                return true;
            }
            /**
            * Arrange and clips a native elements
            *
            */
            arrangeElementNative(pParams) {
                const params = WindowManagerArrangeElementParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                const style = element.style;
                style.position = "absolute";
                style.top = params.Top + "px";
                style.left = params.Left + "px";
                style.width = params.Width === NaN ? "auto" : params.Width + "px";
                style.height = params.Height === NaN ? "auto" : params.Height + "px";
                if (params.Clip) {
                    style.clip = `rect(${params.ClipTop}px, ${params.ClipRight}px, ${params.ClipBottom}px, ${params.ClipLeft}px)`;
                }
                else {
                    style.clip = "";
                }
                this.setAsArranged(element);
                return true;
            }
            setAsArranged(element) {
                if (!element._unoIsArranged) {
                    element._unoIsArranged = true;
                    element.classList.remove(WindowManager.unoUnarrangedClassName);
                }
            }
            setAsUnarranged(element, force = false) {
                if (element._unoIsArranged || force) {
                    element._unoIsArranged = false;
                    element.classList.add(WindowManager.unoUnarrangedClassName);
                }
            }
            /**
            * Sets the color property of the specified element
            */
            setElementColor(elementId, color) {
                this.setElementColorInternal(elementId, color);
                return "ok";
            }
            setElementColorNative(pParam) {
                const params = WindowManagerSetElementColorParams.unmarshal(pParam);
                this.setElementColorInternal(params.HtmlId, params.Color);
                return true;
            }
            setElementColorInternal(elementId, color) {
                const element = this.getView(elementId);
                element.style.setProperty("color", this.numberToCssColor(color));
            }
            /**
            * Sets the fill property of the specified element
            */
            setElementFill(elementId, color) {
                this.setElementColorInternal(elementId, color);
                return "ok";
            }
            setElementFillNative(pParam) {
                const params = WindowManagerSetElementFillParams.unmarshal(pParam);
                this.setElementFillInternal(params.HtmlId, params.Color);
                return true;
            }
            setElementFillInternal(elementId, color) {
                const element = this.getView(elementId);
                element.style.setProperty("fill", this.numberToCssColor(color));
            }
            /**
            * Sets the background color property of the specified element
            */
            setElementBackgroundColor(pParam) {
                const params = WindowManagerSetElementBackgroundColorParams.unmarshal(pParam);
                const element = this.getView(params.HtmlId);
                const style = element.style;
                style.setProperty("background-color", this.numberToCssColor(params.Color));
                style.removeProperty("background-image");
                return true;
            }
            /**
            * Sets the background image property of the specified element
            */
            setElementBackgroundGradient(pParam) {
                const params = WindowManagerSetElementBackgroundGradientParams.unmarshal(pParam);
                const element = this.getView(params.HtmlId);
                const style = element.style;
                style.removeProperty("background-color");
                style.setProperty("background-image", params.CssGradient);
                return true;
            }
            /**
            * Clears the background property of the specified element
            */
            resetElementBackground(pParam) {
                const params = WindowManagerResetElementBackgroundParams.unmarshal(pParam);
                const element = this.getView(params.HtmlId);
                const style = element.style;
                style.removeProperty("background-color");
                style.removeProperty("background-image");
                style.removeProperty("background-size");
                return true;
            }
            /**
            * Sets the transform matrix of an element
            *
            */
            setElementTransformNative(pParams) {
                const params = WindowManagerSetElementTransformParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                const style = element.style;
                const matrix = `matrix(${params.M11},${params.M12},${params.M21},${params.M22},${params.M31},${params.M32})`;
                style.transform = matrix;
                this.setAsArranged(element);
                return true;
            }
            setPointerEvents(htmlId, enabled) {
                const element = this.getView(htmlId);
                element.style.pointerEvents = enabled ? "auto" : "none";
            }
            setPointerEventsNative(pParams) {
                const params = WindowManagerSetPointerEventsParams.unmarshal(pParams);
                this.setPointerEvents(params.HtmlId, params.Enabled);
                return true;
            }
            /**
                * Load the specified URL into a new tab or window
                * @param url URL to load
                * @returns "True" or "False", depending on whether a new window could be opened or not
                */
            open(url) {
                const newWindow = window.open(url, "_blank");
                return newWindow != null
                    ? "True"
                    : "False";
            }
            /**
                * Issue a browser alert to user
                * @param message message to display
                */
            alert(message) {
                window.alert(message);
                return "ok";
            }
            /**
                * Sets the browser window title
                * @param message the new title
                */
            setWindowTitle(title) {
                document.title = title || UnoAppManifest.displayName;
                return "ok";
            }
            /**
                * Gets the currently set browser window title
                */
            getWindowTitle() {
                return document.title || UnoAppManifest.displayName;
            }
            /**
                * Add an event handler to a html element.
                *
                * @param eventName The name of the event
                * @param onCapturePhase true means "on trickle down" (going down to target), false means "on bubble up" (bubbling back to ancestors). Default is false.
                */
            registerEventOnView(elementId, eventName, onCapturePhase = false, eventExtractorId) {
                this.registerEventOnViewInternal(elementId, eventName, onCapturePhase, eventExtractorId);
                return "ok";
            }
            /**
                * Add an event handler to a html element.
                *
                * @param eventName The name of the event
                * @param onCapturePhase true means "on trickle down", false means "on bubble up". Default is false.
                */
            registerEventOnViewNative(pParams) {
                const params = WindowManagerRegisterEventOnViewParams.unmarshal(pParams);
                this.registerEventOnViewInternal(params.HtmlId, params.EventName, params.OnCapturePhase, params.EventExtractorId);
                return true;
            }
            /**
                * Add an event handler to a html element.
                *
                * @param eventName The name of the event
                * @param onCapturePhase true means "on trickle down", false means "on bubble up". Default is false.
                */
            registerEventOnViewInternal(elementId, eventName, onCapturePhase = false, eventExtractorId) {
                const element = this.getView(elementId);
                const eventExtractor = this.getEventExtractor(eventExtractorId);
                const eventHandler = (event) => {
                    const eventPayload = eventExtractor
                        ? `${eventExtractor(event)}`
                        : "";
                    const result = this.dispatchEvent(element, eventName, eventPayload);
                    if (result & UI.HtmlEventDispatchResult.StopPropagation) {
                        event.stopPropagation();
                    }
                    if (result & UI.HtmlEventDispatchResult.PreventDefault) {
                        event.preventDefault();
                    }
                };
                element.addEventListener(eventName, eventHandler, onCapturePhase);
            }
            /**
             * keyboard event extractor to be used with registerEventOnView
             * @param evt
             */
            keyboardEventExtractor(evt) {
                return (evt instanceof KeyboardEvent) ? evt.key : "0";
            }
            /**
             * tapped (mouse clicked / double clicked) event extractor to be used with registerEventOnView
             * @param evt
             */
            tappedEventExtractor(evt) {
                return evt
                    ? `0;${evt.clientX};${evt.clientY};${(evt.ctrlKey ? "1" : "0")};${(evt.shiftKey ? "1" : "0")};${evt.button};mouse`
                    : "";
            }
            /**
             * focus event extractor to be used with registerEventOnView
             * @param evt
             */
            focusEventExtractor(evt) {
                if (evt) {
                    const targetElement = evt.target;
                    if (targetElement) {
                        const targetXamlHandle = targetElement.getAttribute("XamlHandle");
                        if (targetXamlHandle) {
                            return `${targetXamlHandle}`;
                        }
                    }
                }
                return "";
            }
            customEventDetailExtractor(evt) {
                if (evt) {
                    const detail = evt.detail;
                    if (detail) {
                        return JSON.stringify(detail);
                    }
                }
                return "";
            }
            customEventDetailStringExtractor(evt) {
                return evt ? `${evt.detail}` : "";
            }
            /**
             * Gets the event extractor function. See UIElement.HtmlEventExtractor
             * @param eventExtractorName an event extractor name.
             */
            getEventExtractor(eventExtractorId) {
                if (eventExtractorId) {
                    //
                    // NOTE TO MAINTAINERS: Keep in sync with Microsoft.UI.Xaml.UIElement.HtmlEventExtractor
                    //
                    switch (eventExtractorId) {
                        case 3:
                            return this.keyboardEventExtractor;
                        case 2:
                            return this.tappedEventExtractor;
                        case 4:
                            return this.focusEventExtractor;
                        case 6:
                            return this.customEventDetailExtractor;
                        case 5:
                            return this.customEventDetailStringExtractor;
                    }
                    throw `Event extractor ${eventExtractorId} is not supported`;
                }
                return null;
            }
            /**
                * Set or replace the root content element.
                */
            setRootContent(elementId) {
                if (this.rootContent && Number(this.rootContent.id) === elementId) {
                    return null; // nothing to do
                }
                if (this.rootContent) {
                    // Remove existing
                    this.containerElement.removeChild(this.rootContent);
                    if (WindowManager.isLoadEventsEnabled) {
                        this.dispatchEvent(this.rootContent, "unloaded");
                    }
                    this.rootContent.classList.remove(WindowManager.unoRootClassName);
                }
                if (!elementId) {
                    return null;
                }
                // set new root
                const newRootElement = this.getView(elementId);
                newRootElement.classList.add(WindowManager.unoRootClassName);
                this.rootContent = newRootElement;
                if (WindowManager.isLoadEventsEnabled) {
                    this.dispatchEvent(this.rootContent, "loading");
                }
                this.containerElement.appendChild(this.rootContent);
                if (WindowManager.isLoadEventsEnabled) {
                    this.dispatchEvent(this.rootContent, "loaded");
                }
                this.setAsArranged(newRootElement); // patch because root is not measured/arranged
                this.resize();
                return "ok";
            }
            /**
                * Set a view as a child of another one.
                *
                * "Loading" & "Loaded" events will be raised if necessary.
                *
                * @param index Position in children list. Appended at end if not specified.
                */
            addView(parentId, childId, index) {
                this.addViewInternal(parentId, childId, index);
                return "ok";
            }
            /**
                * Set a view as a child of another one.
                *
                * "Loading" & "Loaded" events will be raised if necessary.
                *
                * @param pParams Pointer to a WindowManagerAddViewParams native structure.
                */
            addViewNative(pParams) {
                const params = WindowManagerAddViewParams.unmarshal(pParams);
                this.addViewInternal(params.HtmlId, params.ChildView, params.Index != -1 ? params.Index : null);
                return true;
            }
            addViewInternal(parentId, childId, index) {
                const parentElement = this.getView(parentId);
                const childElement = this.getView(childId);
                let shouldRaiseLoadEvents = false;
                if (WindowManager.isLoadEventsEnabled) {
                    const alreadyLoaded = this.getIsConnectedToRootElement(childElement);
                    shouldRaiseLoadEvents = !alreadyLoaded && this.getIsConnectedToRootElement(parentElement);
                    if (shouldRaiseLoadEvents) {
                        this.dispatchEvent(childElement, "loading");
                    }
                }
                if (index != null && index < parentElement.childElementCount) {
                    const insertBeforeElement = parentElement.children[index];
                    parentElement.insertBefore(childElement, insertBeforeElement);
                }
                else {
                    parentElement.appendChild(childElement);
                }
                if (shouldRaiseLoadEvents) {
                    this.dispatchEvent(childElement, "loaded");
                }
            }
            /**
                * Remove a child from a parent element.
                *
                * "Unloading" & "Unloaded" events will be raised if necessary.
                */
            removeView(parentId, childId) {
                this.removeViewInternal(parentId, childId);
                return "ok";
            }
            /**
                * Remove a child from a parent element.
                *
                * "Unloading" & "Unloaded" events will be raised if necessary.
                */
            removeViewNative(pParams) {
                const params = WindowManagerRemoveViewParams.unmarshal(pParams);
                this.removeViewInternal(params.HtmlId, params.ChildView);
                return true;
            }
            removeViewInternal(parentId, childId) {
                const parentElement = this.getView(parentId);
                const childElement = this.getView(childId);
                const shouldRaiseLoadEvents = WindowManager.isLoadEventsEnabled
                    && this.getIsConnectedToRootElement(childElement);
                parentElement.removeChild(childElement);
                // Mark the element as unarranged, so if it gets measured while being
                // disconnected from the root element, it won't be visible.
                this.setAsUnarranged(childElement);
                if (shouldRaiseLoadEvents) {
                    this.dispatchEvent(childElement, "unloaded");
                }
            }
            /**
                * Destroy a html element.
                *
                * The element won't be available anymore. Usually indicate the managed
                * version has been scavenged by the GC.
                */
            destroyView(elementId) {
                this.destroyViewInternal(elementId);
                return "ok";
            }
            /**
                * Destroy a html element.
                *
                * The element won't be available anymore. Usually indicate the managed
                * version has been scavenged by the GC.
                */
            destroyViewNative(pParams) {
                const params = WindowManagerDestroyViewParams.unmarshal(pParams);
                this.destroyViewInternal(params.HtmlId);
                return true;
            }
            destroyViewInternal(elementId) {
                const element = this.getView(elementId);
                if (element.parentElement) {
                    element.parentElement.removeChild(element);
                }
                delete this.allActiveElementsById[elementId];
            }
            getBoundingClientRect(elementId) {
                const bounds = this.getView(elementId).getBoundingClientRect();
                return `${bounds.left};${bounds.top};${bounds.right - bounds.left};${bounds.bottom - bounds.top}`;
            }
            getBBox(elementId) {
                const bbox = this.getBBoxInternal(elementId);
                return `${bbox.x};${bbox.y};${bbox.width};${bbox.height}`;
            }
            getBBoxNative(pParams, pReturn) {
                const params = WindowManagerGetBBoxParams.unmarshal(pParams);
                const bbox = this.getBBoxInternal(params.HtmlId);
                const ret = new WindowManagerGetBBoxReturn();
                ret.X = bbox.x;
                ret.Y = bbox.y;
                ret.Width = bbox.width;
                ret.Height = bbox.height;
                ret.marshal(pReturn);
                return true;
            }
            getBBoxInternal(elementId) {
                const element = this.getView(elementId);
                let unconnectedRoot = null;
                const cleanupUnconnectedRoot = (owner) => {
                    if (unconnectedRoot !== null) {
                        owner.removeChild(unconnectedRoot);
                    }
                };
                try {
                    // On FireFox, the element needs to be connected to the DOM
                    // or the getBBox() will crash.
                    if (!element.isConnected) {
                        unconnectedRoot = element;
                        while (unconnectedRoot.parentElement) {
                            // Need to find the top most "unconnected" parent
                            // of this element
                            unconnectedRoot = unconnectedRoot.parentElement;
                        }
                        this.containerElement.appendChild(unconnectedRoot);
                    }
                    return element.getBBox();
                }
                finally {
                    cleanupUnconnectedRoot(this.containerElement);
                }
            }
            setSvgElementRect(pParams) {
                const params = WindowManagerSetSvgElementRectParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                element.x.baseVal.value = params.X;
                element.y.baseVal.value = params.Y;
                element.width.baseVal.value = params.Width;
                element.height.baseVal.value = params.Height;
                return true;
            }
            /**
                * Use the Html engine to measure the element using specified constraints.
                *
                * @param maxWidth string containing width in pixels. Empty string means infinite.
                * @param maxHeight string containing height in pixels. Empty string means infinite.
                * @param measureContent if we're interested by the content of the control (<img>'s image, <input>'s text...)
                */
            measureView(viewId, maxWidth, maxHeight, measureContent = true) {
                const ret = this.measureViewInternal(Number(viewId), maxWidth ? Number(maxWidth) : NaN, maxHeight ? Number(maxHeight) : NaN, measureContent);
                return `${ret[0]};${ret[1]}`;
            }
            /**
                * Use the Html engine to measure the element using specified constraints.
                *
                * @param maxWidth string containing width in pixels. Empty string means infinite.
                * @param maxHeight string containing height in pixels. Empty string means infinite.
                */
            measureViewNative(pParams, pReturn) {
                const params = WindowManagerMeasureViewParams.unmarshal(pParams);
                const ret = this.measureViewInternal(params.HtmlId, params.AvailableWidth, params.AvailableHeight, params.MeasureContent);
                const ret2 = new WindowManagerMeasureViewReturn();
                ret2.DesiredWidth = ret[0];
                ret2.DesiredHeight = ret[1];
                ret2.marshal(pReturn);
                return true;
            }
            measureElement(element) {
                const offsetWidth = element.offsetWidth;
                const offsetHeight = element.offsetHeight;
                const resultWidth = offsetWidth ? offsetWidth : element.clientWidth;
                const resultHeight = offsetHeight ? offsetHeight : element.clientHeight;
                // +1 is added to take rounding/flooring into account
                return [resultWidth + 1, resultHeight];
            }
            measureViewInternal(viewId, maxWidth, maxHeight, measureContent) {
                const element = this.getView(viewId);
                const elementStyle = element.style;
                const elementClasses = element.className;
                const originalStyleCssText = elementStyle.cssText;
                const unconstrainedStyleCssText = this.createUnconstrainedStyle(elementStyle, maxWidth, maxHeight);
                let parentElement = null;
                let parentElementWidthHeight = null;
                let unconnectedRoot = null;
                const cleanupUnconnectedRoot = (owner) => {
                    if (unconnectedRoot !== null) {
                        owner.removeChild(unconnectedRoot);
                    }
                };
                try {
                    if (!element.isConnected) {
                        // If the element is not connected to the DOM, we need it
                        // to be connected for the measure to provide a meaningful value.
                        unconnectedRoot = element;
                        while (unconnectedRoot.parentElement) {
                            // Need to find the top most "unconnected" parent
                            // of this element
                            unconnectedRoot = unconnectedRoot.parentElement;
                        }
                        this.containerElement.appendChild(unconnectedRoot);
                    }
                    if (measureContent && element instanceof HTMLImageElement) {
                        elementStyle.cssText = unconstrainedStyleCssText;
                        const imgElement = element;
                        return [imgElement.naturalWidth, imgElement.naturalHeight];
                    }
                    else if (measureContent && element instanceof HTMLInputElement) {
                        elementStyle.cssText = unconstrainedStyleCssText;
                        const inputElement = element;
                        cleanupUnconnectedRoot(this.containerElement);
                        // Create a temporary element that will contain the input's content
                        const textOnlyElement = document.createElement("p");
                        textOnlyElement.style.cssText = unconstrainedStyleCssText;
                        textOnlyElement.innerText = inputElement.value;
                        textOnlyElement.className = elementClasses;
                        unconnectedRoot = textOnlyElement;
                        this.containerElement.appendChild(unconnectedRoot);
                        const textSize = this.measureElement(textOnlyElement);
                        const inputSize = this.measureElement(element);
                        // Take the width of the inner text, but keep the height of the input element.
                        return [textSize[0], inputSize[1]];
                    }
                    else if (measureContent && element instanceof HTMLTextAreaElement) {
                        const inputElement = element;
                        cleanupUnconnectedRoot(this.containerElement);
                        // Create a temporary element that will contain the input's content
                        const textOnlyElement = document.createElement("p");
                        textOnlyElement.style.cssText = unconstrainedStyleCssText;
                        // If the input is null or empty, add a no-width character to force the paragraph to take up one line height
                        // The trailing new lines are going to be ignored for measure, so we also append no-width char at the end.
                        textOnlyElement.innerText = inputElement.value ? (inputElement.value + "\u200B") : "\u200B";
                        textOnlyElement.className = elementClasses; // Note: Here we will have the uno-textBoxView class name
                        unconnectedRoot = textOnlyElement;
                        this.containerElement.appendChild(unconnectedRoot);
                        const textSize = this.measureElement(textOnlyElement);
                        // For TextAreas, take the width and height of the inner text
                        const width = Math.min(textSize[0], maxWidth);
                        const height = Math.min(textSize[1], maxHeight);
                        return [width, height];
                    }
                    else {
                        elementStyle.cssText = unconstrainedStyleCssText;
                        // As per W3C css-transform spec:
                        // https://www.w3.org/TR/css-transforms-1/#propdef-transform
                        //
                        // > For elements whose layout is governed by the CSS box model, any value other than none
                        // > for the transform property also causes the element to establish a containing block for
                        // > all descendants.Its padding box will be used to layout for all of its
                        // > absolute - position descendants, fixed - position descendants, and descendant fixed
                        // > background attachments.
                        //
                        // We use this feature to allow an measure of text without being influenced by the bounds
                        // of the viewport. We just need to temporary set both the parent width & height to a very big value.
                        parentElement = element.parentElement;
                        parentElementWidthHeight = { width: parentElement.style.width, height: parentElement.style.height };
                        parentElement.style.width = WindowManager.MAX_WIDTH;
                        parentElement.style.height = WindowManager.MAX_HEIGHT;
                        return this.measureElement(element);
                    }
                }
                finally {
                    elementStyle.cssText = originalStyleCssText;
                    if (parentElement && parentElementWidthHeight) {
                        parentElement.style.width = parentElementWidthHeight.width;
                        parentElement.style.height = parentElementWidthHeight.height;
                    }
                    cleanupUnconnectedRoot(this.containerElement);
                }
            }
            createUnconstrainedStyle(elementStyle, maxWidth, maxHeight) {
                const updatedStyles = {};
                for (let i = 0; i < elementStyle.length; i++) {
                    const key = elementStyle[i];
                    updatedStyles[key] = elementStyle.getPropertyValue(key);
                }
                if (updatedStyles.hasOwnProperty("width")) {
                    delete updatedStyles.width;
                }
                if (updatedStyles.hasOwnProperty("height")) {
                    delete updatedStyles.height;
                }
                // This is required for an unconstrained measure (otherwise the parents size is taken into account)
                updatedStyles.position = "fixed";
                updatedStyles["max-width"] = Number.isFinite(maxWidth) ? maxWidth + "px" : "none";
                updatedStyles["max-height"] = Number.isFinite(maxHeight) ? maxHeight + "px" : "none";
                let updatedStyleString = "";
                for (let key in updatedStyles) {
                    if (updatedStyles.hasOwnProperty(key)) {
                        updatedStyleString += key + ": " + updatedStyles[key] + "; ";
                    }
                }
                // We use a string to prevent the browser to update the element between
                // each style assignation. This way, the browser will update the element only once.
                return updatedStyleString;
            }
            scrollTo(pParams) {
                const params = WindowManagerScrollToOptionsParams.unmarshal(pParams);
                const elt = this.getView(params.HtmlId);
                const opts = ({
                    left: params.HasLeft ? params.Left : undefined,
                    top: params.HasTop ? params.Top : undefined,
                    behavior: (params.DisableAnimation ? "instant" : "smooth")
                });
                elt.scrollTo(opts);
                return true;
            }
            rawPixelsToBase64EncodeImage(dataPtr, width, height) {
                const rawCanvas = document.createElement("canvas");
                rawCanvas.width = width;
                rawCanvas.height = height;
                const ctx = rawCanvas.getContext("2d");
                const imgData = ctx.createImageData(width, height);
                const bufferSize = width * height * 4;
                for (let i = 0; i < bufferSize; i += 4) {
                    imgData.data[i + 0] = Module.HEAPU8[dataPtr + i + 2];
                    imgData.data[i + 1] = Module.HEAPU8[dataPtr + i + 1];
                    imgData.data[i + 2] = Module.HEAPU8[dataPtr + i + 0];
                    imgData.data[i + 3] = Module.HEAPU8[dataPtr + i + 3];
                }
                ctx.putImageData(imgData, 0, 0);
                return rawCanvas.toDataURL();
            }
            /**
             * Sets the provided image with a mono-chrome version of the provided url.
             * @param viewId the image to manipulate
             * @param url the source image
             * @param color the color to apply to the monochrome pixels
             */
            setImageAsMonochrome(viewId, url, color) {
                const element = this.getView(viewId);
                if (element.tagName.toUpperCase() === "IMG") {
                    const imgElement = element;
                    const img = new Image();
                    img.onload = buildMonochromeImage;
                    img.src = url;
                    function buildMonochromeImage() {
                        // create a colored version of img
                        const c = document.createElement("canvas");
                        const ctx = c.getContext("2d");
                        c.width = img.width;
                        c.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        ctx.globalCompositeOperation = "source-atop";
                        ctx.fillStyle = color;
                        ctx.fillRect(0, 0, img.width, img.height);
                        ctx.globalCompositeOperation = "source-over";
                        imgElement.src = c.toDataURL();
                    }
                    return "ok";
                }
                else {
                    throw `setImageAsMonochrome: Element id ${viewId} is not an Img.`;
                }
            }
            setPointerCapture(viewId, pointerId) {
                this.getView(viewId).setPointerCapture(pointerId);
                return "ok";
            }
            releasePointerCapture(viewId, pointerId) {
                this.getView(viewId).releasePointerCapture(pointerId);
                return "ok";
            }
            focusView(elementId) {
                const element = this.getView(elementId);
                if (!(element instanceof HTMLElement)) {
                    throw `Element id ${elementId} is not focusable.`;
                }
                element.focus();
                return "ok";
            }
            /**
                * Set the Html content for an element.
                *
                * Those html elements won't be available as XamlElement in managed code.
                * WARNING: you should avoid mixing this and `addView` for the same element.
                */
            setHtmlContent(viewId, html) {
                this.setHtmlContentInternal(viewId, html);
                return "ok";
            }
            /**
                * Set the Html content for an element.
                *
                * Those html elements won't be available as XamlElement in managed code.
                * WARNING: you should avoid mixing this and `addView` for the same element.
                */
            setHtmlContentNative(pParams) {
                const params = WindowManagerSetContentHtmlParams.unmarshal(pParams);
                this.setHtmlContentInternal(params.HtmlId, params.Html);
                return true;
            }
            setHtmlContentInternal(viewId, html) {
                this.getView(viewId).innerHTML = html;
            }
            /**
             * Gets the Client and Offset size of the specified element
             *
             * This method is used to determine the size of the scroll bars, to
             * mask the events coming from that zone.
             */
            getClientViewSize(elementId) {
                const element = this.getView(elementId);
                return `${element.clientWidth};${element.clientHeight};${element.offsetWidth};${element.offsetHeight}`;
            }
            /**
             * Gets the Client and Offset size of the specified element
             *
             * This method is used to determine the size of the scroll bars, to
             * mask the events coming from that zone.
             */
            getClientViewSizeNative(pParams, pReturn) {
                const params = WindowManagerGetClientViewSizeParams.unmarshal(pParams);
                const element = this.getView(params.HtmlId);
                const ret2 = new WindowManagerGetClientViewSizeReturn();
                ret2.ClientWidth = element.clientWidth;
                ret2.ClientHeight = element.clientHeight;
                ret2.OffsetWidth = element.offsetWidth;
                ret2.OffsetHeight = element.offsetHeight;
                ret2.marshal(pReturn);
                return true;
            }
            /**
             * Gets a dependency property value.
             *
             * Note that the casing of this method is intentionally Pascal for platform alignment.
             */
            GetDependencyPropertyValue(elementId, propertyName) {
                if (!WindowManager.getDependencyPropertyValueMethod) {
                    WindowManager.getDependencyPropertyValueMethod = Module.mono_bind_static_method("[Uno.UI] Uno.UI.Helpers.Automation:GetDependencyPropertyValue");
                }
                const element = this.getView(elementId);
                const htmlId = Number(element.getAttribute("XamlHandle"));
                return WindowManager.getDependencyPropertyValueMethod(htmlId, propertyName);
            }
            /**
             * Sets a dependency property value.
             *
             * Note that the casing of this method is intentionally Pascal for platform alignment.
             */
            SetDependencyPropertyValue(elementId, propertyNameAndValue) {
                if (!WindowManager.setDependencyPropertyValueMethod) {
                    WindowManager.setDependencyPropertyValueMethod = Module.mono_bind_static_method("[Uno.UI] Uno.UI.Helpers.Automation:SetDependencyPropertyValue");
                }
                const element = this.getView(elementId);
                const htmlId = Number(element.getAttribute("XamlHandle"));
                return WindowManager.setDependencyPropertyValueMethod(htmlId, propertyNameAndValue);
            }
            /**
                * Remove the loading indicator.
                *
                * In a future version it will also handle the splashscreen.
                */
            activate() {
                this.removeLoading();
                return "ok";
            }
            init() {
                if (UnoAppManifest.displayName) {
                    document.title = UnoAppManifest.displayName;
                }
                window.addEventListener("beforeunload", () => WindowManager.dispatchSuspendingMethod());
            }
            static initMethods() {
                if (WindowManager.isHosted) {
                    console.debug("Hosted Mode: Skipping MonoRuntime initialization ");
                }
                else {
                    if (!WindowManager.resizeMethod) {
                        WindowManager.resizeMethod = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.Window:Resize");
                    }
                    if (!WindowManager.dispatchEventMethod) {
                        WindowManager.dispatchEventMethod = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.UIElement:DispatchEvent");
                    }
                    if (!WindowManager.focusInMethod) {
                        WindowManager.focusInMethod = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.Input.FocusManager:ReceiveFocusNative");
                    }
                    if (!WindowManager.dispatchSuspendingMethod) {
                        WindowManager.dispatchSuspendingMethod = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.Application:DispatchSuspending");
                    }
                }
            }
            initDom() {
                this.containerElement = document.getElementById(this.containerElementId);
                if (!this.containerElement) {
                    // If not found, we simply create a new one.
                    this.containerElement = document.createElement("div");
                }
                document.body.addEventListener("focusin", this.onfocusin);
                document.body.appendChild(this.containerElement);
                window.addEventListener("resize", x => this.resize());
                window.addEventListener("contextmenu", x => {
                    if (!(x.target instanceof HTMLInputElement) ||
                        x.target.classList.contains("context-menu-disabled")) {
                        x.preventDefault();
                    }
                });
                window.addEventListener("blur", this.onWindowBlur);
            }
            removeLoading() {
                if (!this.loadingElementId) {
                    return;
                }
                const element = document.getElementById(this.loadingElementId);
                if (element) {
                    element.parentElement.removeChild(element);
                }
                // UWP Window's default background is white.
                const body = document.getElementsByTagName("body")[0];
                body.style.backgroundColor = "#fff";
            }
            resize() {
                if (WindowManager.isHosted) {
                    UnoDispatch.resize(`${document.documentElement.clientWidth};${document.documentElement.clientHeight}`);
                }
                else {
                    WindowManager.resizeMethod(document.documentElement.clientWidth, document.documentElement.clientHeight);
                }
            }
            onfocusin(event) {
                if (WindowManager.isHosted) {
                    console.warn("Focus not supported in hosted mode");
                }
                else {
                    const newFocus = event.target;
                    const handle = newFocus.getAttribute("XamlHandle");
                    const htmlId = handle ? Number(handle) : -1; // newFocus may not be an Uno element
                    WindowManager.focusInMethod(htmlId);
                }
            }
            onWindowBlur() {
                if (WindowManager.isHosted) {
                    console.warn("Focus not supported in hosted mode");
                }
                else {
                    // Unset managed focus when Window loses focus
                    WindowManager.focusInMethod(-1);
                }
            }
            dispatchEvent(element, eventName, eventPayload = null) {
                const htmlId = Number(element.getAttribute("XamlHandle"));
                // console.debug(`${element.getAttribute("id")}: Raising event ${eventName}.`);
                if (!htmlId) {
                    throw `No attribute XamlHandle on element ${element}. Can't raise event.`;
                }
                if (WindowManager.isHosted) {
                    // Dispatch to the C# backed UnoDispatch class. Events propagated
                    // this way always succeed because synchronous calls are not possible
                    // between the host and the browser, unlike wasm.
                    UnoDispatch.dispatch(this.handleToString(htmlId), eventName, eventPayload);
                    return UI.HtmlEventDispatchResult.Ok;
                }
                else {
                    return WindowManager.dispatchEventMethod(htmlId, eventName, eventPayload || "");
                }
            }
            getIsConnectedToRootElement(element) {
                const rootElement = this.rootContent;
                if (!rootElement) {
                    return false;
                }
                return rootElement === element || rootElement.contains(element);
            }
            handleToString(handle) {
                // Fastest conversion as of 2020-03-25 (when compared to String(handle) or handle.toString())
                return handle + "";
            }
            numberToCssColor(color) {
                return "#" + color.toString(16).padStart(8, "0");
            }
            setCursor(cssCursor) {
                const unoBody = document.getElementById(this.containerElementId);
                if (unoBody) {
                    //always cleanup
                    if (this.cursorStyleElement != undefined) {
                        this.cursorStyleElement.remove();
                        this.cursorStyleElement = undefined;
                    }
                    //only add custom overriding style if not auto 
                    if (cssCursor != "auto") {
                        // this part is only to override default css:  .uno-buttonbase {cursor: pointer;}
                        this.cursorStyleElement = document.createElement("style");
                        this.cursorStyleElement.innerHTML = ".uno-buttonbase { cursor: " + cssCursor + "; }";
                        document.body.appendChild(this.cursorStyleElement);
                    }
                    unoBody.style.cursor = cssCursor;
                }
                return "ok";
            }
            getNaturalImageSize(imageUrl) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    let loadingDone = () => {
                        this.containerElement.removeChild(img);
                        resolve(`${img.width};${img.height}`);
                    };
                    let loadingError = (e) => {
                        this.containerElement.removeChild(img);
                        reject(e);
                    };
                    img.style.pointerEvents = "none";
                    img.style.opacity = "0";
                    img.onload = loadingDone;
                    img.onerror = loadingError;
                    img.src = imageUrl;
                    this.containerElement.appendChild(img);
                });
            }
            selectInputRange(elementId, start, length) {
                this.getView(elementId).setSelectionRange(start, start + length);
            }
        }
        WindowManager._isHosted = false;
        WindowManager._isLoadEventsEnabled = false;
        WindowManager.unoRootClassName = "uno-root-element";
        WindowManager.unoUnarrangedClassName = "uno-unarranged";
        WindowManager.unoCollapsedClassName = "uno-visibility-collapsed";
        WindowManager._cctor = (() => {
            WindowManager.initMethods();
            UI.HtmlDom.initPolyfills();
        })();
        WindowManager.MAX_WIDTH = `${Number.MAX_SAFE_INTEGER}vw`;
        WindowManager.MAX_HEIGHT = `${Number.MAX_SAFE_INTEGER}vh`;
        UI.WindowManager = WindowManager;
        if (typeof define === "function") {
            define([`./AppManifest.js`], () => {
            });
        }
        else {
            throw `The Uno.Wasm.Boostrap is not up to date, please upgrade to a later version`;
        }
    })(UI = Uno.UI || (Uno.UI = {}));
})(Uno || (Uno = {}));
// Ensure the "Uno" namespace is available globally
window.Uno = Uno;
window.Windows = Windows;
PointerEvent.prototype.isOver = function (element) {
    const bounds = element.getBoundingClientRect();
    return this.pageX >= bounds.left
        && this.pageX < bounds.right
        && this.pageY >= bounds.top
        && this.pageY < bounds.bottom;
};
PointerEvent.prototype.isOverDeep = function (element) {
    if (!element) {
        return false;
    }
    else if (element.style.pointerEvents != "none") {
        return this.isOver(element);
    }
    else {
        for (let elt of element.children) {
            if (this.isOverDeep(elt)) {
                return true;
            }
        }
    }
};
PointerEvent.prototype.isDirectlyOver = function (element) {
    if (!this.isOver(element)) {
        return false;
    }
    for (let elt of document.elementsFromPoint(this.clientX, this.clientY)) {
        if (elt === element) {
            // We found our target element, so the pointer effectively over it.
            return true;
        }
        let htmlElt = elt;
        if (htmlElt.style.pointerEvents !== "none") {
            // This 'htmlElt' is handling the pointers events, this mean that we can stop the loop.
            // However, if this 'htmlElt' is one of the children of the element it means that the pointer is over element.
            while (htmlElt.parentElement) {
                htmlElt = htmlElt.parentElement;
                if (htmlElt === element) {
                    return true;
                }
            }
            // We found an element this is capable to handle the pointers but which is not a child of 'element'
            // (a sibling which is covering the element ... like a PopupRoot).
            // It means that the pointer is not ** DIRECTLY ** over the element.
            return false;
        }
    }
    return false;
};
var Uno;
(function (Uno) {
    var UI;
    (function (UI) {
        var Interop;
        (function (Interop) {
            class AsyncInteropHelper {
                static init() {
                    if (AsyncInteropHelper.dispatchErrorMethod) {
                        return; // already initialized
                    }
                    const w = window;
                    AsyncInteropHelper.dispatchResultMethod =
                        w.Module.mono_bind_static_method("[Uno.Foundation.Runtime.WebAssembly] Uno.Foundation.WebAssemblyRuntime:DispatchAsyncResult");
                    AsyncInteropHelper.dispatchErrorMethod =
                        w.Module.mono_bind_static_method("[Uno.Foundation.Runtime.WebAssembly] Uno.Foundation.WebAssemblyRuntime:DispatchAsyncError");
                }
                static Invoke(handle, promiseFunction) {
                    AsyncInteropHelper.init();
                    try {
                        promiseFunction()
                            .then(str => {
                            if (typeof str == "string") {
                                AsyncInteropHelper.dispatchResultMethod(handle, str);
                            }
                            else {
                                AsyncInteropHelper.dispatchResultMethod(handle, null);
                            }
                        })
                            .catch(err => {
                            if (typeof err == "string") {
                                AsyncInteropHelper.dispatchErrorMethod(handle, err);
                            }
                            else if (err.message && err.stack) {
                                AsyncInteropHelper.dispatchErrorMethod(handle, err.message + "\n" + err.stack);
                            }
                            else {
                                AsyncInteropHelper.dispatchErrorMethod(handle, "" + err);
                            }
                        });
                    }
                    catch (err) {
                        if (typeof err == "string") {
                            AsyncInteropHelper.dispatchErrorMethod(handle, err);
                        }
                        else if (err.message && err.stack) {
                            AsyncInteropHelper.dispatchErrorMethod(handle, err.message + "\n" + err.stack);
                        }
                        else {
                            AsyncInteropHelper.dispatchErrorMethod(handle, "" + err);
                        }
                    }
                }
            }
            Interop.AsyncInteropHelper = AsyncInteropHelper;
        })(Interop = UI.Interop || (UI.Interop = {}));
    })(UI = Uno.UI || (Uno.UI = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Foundation;
    (function (Foundation) {
        var Interop;
        (function (Interop) {
            class ManagedObject {
                static init() {
                    ManagedObject.dispatchMethod = Module.mono_bind_static_method("[Uno.Foundation.Runtime.WebAssembly] Uno.Foundation.Interop.JSObject:Dispatch");
                }
                static dispatch(handle, method, parameters) {
                    if (!ManagedObject.dispatchMethod) {
                        ManagedObject.init();
                    }
                    ManagedObject.dispatchMethod(handle, method, parameters || "");
                }
            }
            Interop.ManagedObject = ManagedObject;
        })(Interop = Foundation.Interop || (Foundation.Interop = {}));
    })(Foundation = Uno.Foundation || (Uno.Foundation = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var UI;
    (function (UI) {
        var Interop;
        (function (Interop) {
            class Runtime {
                static init() {
                    return "";
                }
            }
            Runtime.engine = Runtime.init();
            Interop.Runtime = Runtime;
        })(Interop = UI.Interop || (UI.Interop = {}));
    })(UI = Uno.UI || (Uno.UI = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var UI;
    (function (UI) {
        var Interop;
        (function (Interop) {
            class Xaml {
            }
            Interop.Xaml = Xaml;
        })(Interop = UI.Interop || (UI.Interop = {}));
    })(UI = Uno.UI || (Uno.UI = {}));
})(Uno || (Uno = {}));
// ReSharper disable InconsistentNaming
var ContactProperty;
(function (ContactProperty) {
    ContactProperty["Address"] = "address";
    ContactProperty["Email"] = "email";
    ContactProperty["Icon"] = "icon";
    ContactProperty["Name"] = "name";
    ContactProperty["Tel"] = "tel";
})(ContactProperty || (ContactProperty = {}));
;
var Windows;
(function (Windows) {
    var ApplicationModel;
    (function (ApplicationModel) {
        var Contacts;
        (function (Contacts) {
            class ContactPicker {
                static isSupported() {
                    return 'contacts' in navigator && 'ContactsManager' in window;
                }
                static async pickContacts(pickMultiple) {
                    const props = [ContactProperty.Name, ContactProperty.Email, ContactProperty.Tel, ContactProperty.Address];
                    const opts = {
                        multiple: pickMultiple
                    };
                    try {
                        const contacts = await navigator.contacts.select(props, opts);
                        return JSON.stringify(contacts);
                    }
                    catch (ex) {
                        console.log("Error occurred while picking contacts.");
                        return null;
                    }
                }
            }
            Contacts.ContactPicker = ContactPicker;
        })(Contacts = ApplicationModel.Contacts || (ApplicationModel.Contacts = {}));
    })(ApplicationModel = Windows.ApplicationModel || (Windows.ApplicationModel = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var ApplicationModel;
    (function (ApplicationModel) {
        var DataTransfer;
        (function (DataTransfer) {
            class DataTransferManager {
                static isSupported() {
                    var navigatorAny = navigator;
                    return typeof navigatorAny.share === "function";
                }
                static async showShareUI(title, text, url) {
                    var data = {};
                    if (title) {
                        data.title = title;
                    }
                    if (text) {
                        data.text = text;
                    }
                    if (url) {
                        data.url = url;
                    }
                    if (navigator.share) {
                        try {
                            await navigator.share(data);
                            return "true";
                        }
                        catch (e) {
                            console.log("Sharing failed:" + e);
                            return "false";
                        }
                    }
                    console.log("navigator.share API is not available in this browser");
                    return "false";
                }
            }
            DataTransfer.DataTransferManager = DataTransferManager;
        })(DataTransfer = ApplicationModel.DataTransfer || (ApplicationModel.DataTransfer = {}));
    })(ApplicationModel = Windows.ApplicationModel || (Windows.ApplicationModel = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var ApplicationModel;
    (function (ApplicationModel) {
        var DataTransfer;
        (function (DataTransfer) {
            var DragDrop;
            (function (DragDrop) {
                var Core;
                (function (Core) {
                    class DragDropExtension {
                        constructor() {
                            // Events fired on the drop target
                            // Note: dragenter and dragover events will enable drop on the app
                            this._dropHandler = this.dispatchDropEvent.bind(this);
                            document.addEventListener("dragenter", this._dropHandler);
                            document.addEventListener("dragover", this._dropHandler);
                            document.addEventListener("dragleave", this._dropHandler); // Seems to be raised also on drop?
                            document.addEventListener("drop", this._dropHandler);
                            // Events fired on the draggable target (the source element)
                            //this._dragHandler = this.dispatchDragEvent.bind(this);
                            //document.addEventListener("dragstart", this._dragHandler);
                            //document.addEventListener("drag", this._dragHandler);
                            //document.addEventListener("dragend", this._dragHandler);
                        }
                        static enable(pArgs) {
                            if (!DragDropExtension._dispatchDropEventMethod) {
                                DragDropExtension._dispatchDropEventMethod = Module.mono_bind_static_method("[Uno.UI] Windows.ApplicationModel.DataTransfer.DragDrop.Core.DragDropExtension:OnNativeDropEvent");
                            }
                            if (DragDropExtension._current) {
                                throw new Error("A DragDropExtension has already been enabled");
                            }
                            DragDropExtension._dispatchDragDropArgs = pArgs;
                            DragDropExtension._nextDropId = 1;
                            DragDropExtension._current = new DragDropExtension();
                        }
                        static disable(pArgs) {
                            if (DragDropExtension._dispatchDragDropArgs != pArgs) {
                                throw new Error("The current DragDropExtension does not match the provided args");
                            }
                            DragDropExtension._current.dispose();
                            DragDropExtension._current = null;
                            DragDropExtension._dispatchDragDropArgs = null;
                        }
                        dispose() {
                            // Events fired on the drop target
                            document.removeEventListener("dragenter", this._dropHandler);
                            document.removeEventListener("dragover", this._dropHandler);
                            document.removeEventListener("dragleave", this._dropHandler); // Seems to be raised also on drop?
                            document.removeEventListener("drop", this._dropHandler);
                        }
                        dispatchDropEvent(evt) {
                            if (evt.type == "dragleave"
                                && evt.clientX > 0
                                && evt.clientX < document.documentElement.clientWidth
                                && evt.clientY > 0
                                && evt.clientY < document.documentElement.clientHeight) {
                                // We ignore all dragleave while if pointer is still over the window.
                                // This is to mute bubbling of drag leave when crossing boundaries of any elements on the app.
                                return;
                            }
                            if (evt.type == "dragenter") {
                                if (this._pendingDropId > 0) {
                                    // For the same reason as above, we ignore all dragenter if there is already a pending active drop
                                    return;
                                }
                                this._pendingDropId = ++DragDropExtension._nextDropId;
                            }
                            // We must keep a reference to the dataTransfer in order to be able to retrieve data items
                            this._pendingDropData = evt.dataTransfer;
                            // Prepare args
                            let args = new Core.DragDropExtensionEventArgs();
                            args.id = this._pendingDropId;
                            args.eventName = evt.type;
                            args.timestamp = evt.timeStamp;
                            args.x = evt.clientX;
                            args.y = evt.clientY;
                            args.buttons = evt.buttons;
                            args.shift = evt.shiftKey;
                            args.ctrl = evt.ctrlKey;
                            args.alt = evt.altKey;
                            if (evt.type == "dragenter") { // We use the dataItems only for enter, no needs to copy them every time!
                                const items = new Array();
                                for (let itemId = 0; itemId < evt.dataTransfer.items.length; itemId++) {
                                    const item = evt.dataTransfer.items[itemId];
                                    items.push({ id: itemId, kind: item.kind, type: item.type });
                                }
                                args.dataItems = JSON.stringify(items);
                                args.allowedOperations = evt.dataTransfer.effectAllowed;
                            }
                            else {
                                // Must be set for marshaling
                                args.dataItems = "";
                                args.allowedOperations = "";
                            }
                            args.acceptedOperation = evt.dataTransfer.dropEffect;
                            try {
                                // Raise the managed event
                                args.marshal(DragDropExtension._dispatchDragDropArgs);
                                DragDropExtension._dispatchDropEventMethod();
                                // Read response from managed code
                                args = Core.DragDropExtensionEventArgs.unmarshal(DragDropExtension._dispatchDragDropArgs);
                                evt.dataTransfer.dropEffect = (args.acceptedOperation);
                            }
                            finally {
                                // No matter if the managed code handled the event, we want to prevent thee default behavior (like opening a drop link)
                                evt.preventDefault();
                                if (evt.type == "dragleave" || evt.type == "drop") {
                                    this._pendingDropData = null;
                                    this._pendingDropId = 0;
                                }
                            }
                        }
                        static async retrieveText(itemId) {
                            const current = DragDropExtension._current;
                            const data = current === null || current === void 0 ? void 0 : current._pendingDropData;
                            if (data == null) {
                                throw new Error("No pending drag and drop data.");
                            }
                            return new Promise((resolve, reject) => {
                                const item = data.items[itemId];
                                const timeout = setTimeout(() => reject("Timeout: for security reason, you cannot access data before drop."), 15000);
                                item.getAsString(str => {
                                    clearTimeout(timeout);
                                    resolve(str);
                                });
                            });
                        }
                        static async retrieveFiles(itemIds) {
                            var _a;
                            const data = (_a = DragDropExtension._current) === null || _a === void 0 ? void 0 : _a._pendingDropData;
                            if (data == null) {
                                throw new Error("No pending drag and drop data.");
                            }
                            const fileHandles = [];
                            if (Array.isArray(itemIds)) {
                                for (const id of itemIds) {
                                    fileHandles.push(await DragDropExtension.getAsFile(data.items[id]));
                                }
                            }
                            else {
                                fileHandles.push(await DragDropExtension.getAsFile(data.items[itemIds]));
                            }
                            const infos = Uno.Storage.NativeStorageItem.getInfos(...fileHandles);
                            return JSON.stringify(infos);
                        }
                        static async getAsFile(item) {
                            if (item.getAsFileSystemHandle) {
                                return await item.getAsFileSystemHandle();
                            }
                            else {
                                return item.getAsFile();
                            }
                        }
                    }
                    Core.DragDropExtension = DragDropExtension;
                })(Core = DragDrop.Core || (DragDrop.Core = {}));
            })(DragDrop = DataTransfer.DragDrop || (DataTransfer.DragDrop = {}));
        })(DataTransfer = ApplicationModel.DataTransfer || (ApplicationModel.DataTransfer = {}));
    })(ApplicationModel = Windows.ApplicationModel || (Windows.ApplicationModel = {}));
})(Windows || (Windows = {}));
var Uno;
(function (Uno) {
    var Devices;
    (function (Devices) {
        var Enumeration;
        (function (Enumeration) {
            var Internal;
            (function (Internal) {
                var Providers;
                (function (Providers) {
                    var Midi;
                    (function (Midi) {
                        class MidiDeviceClassProvider {
                            static findDevices(findInputDevices) {
                                var result = "";
                                const midi = Uno.Devices.Midi.Internal.WasmMidiAccess.getMidi();
                                if (findInputDevices) {
                                    midi.inputs.forEach((input, key) => {
                                        const inputId = input.id;
                                        const name = input.name;
                                        const encodedMetadata = encodeURIComponent(inputId) + '#' + encodeURIComponent(name);
                                        result += encodedMetadata + '&';
                                    });
                                }
                                else {
                                    midi.outputs.forEach((output, key) => {
                                        const outputId = output.id;
                                        const name = output.name;
                                        const encodedMetadata = encodeURIComponent(outputId) + '#' + encodeURIComponent(name);
                                        result += encodedMetadata + '&';
                                    });
                                }
                                return result;
                            }
                        }
                        Midi.MidiDeviceClassProvider = MidiDeviceClassProvider;
                    })(Midi = Providers.Midi || (Providers.Midi = {}));
                })(Providers = Internal.Providers || (Internal.Providers = {}));
            })(Internal = Enumeration.Internal || (Enumeration.Internal = {}));
        })(Enumeration = Devices.Enumeration || (Devices.Enumeration = {}));
    })(Devices = Uno.Devices || (Uno.Devices = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Devices;
    (function (Devices) {
        var Enumeration;
        (function (Enumeration) {
            var Internal;
            (function (Internal) {
                var Providers;
                (function (Providers) {
                    var Midi;
                    (function (Midi) {
                        class MidiDeviceConnectionWatcher {
                            static startStateChanged() {
                                const midi = Uno.Devices.Midi.Internal.WasmMidiAccess.getMidi();
                                midi.addEventListener("statechange", MidiDeviceConnectionWatcher.onStateChanged);
                            }
                            static stopStateChanged() {
                                const midi = Uno.Devices.Midi.Internal.WasmMidiAccess.getMidi();
                                midi.removeEventListener("statechange", MidiDeviceConnectionWatcher.onStateChanged);
                            }
                            static onStateChanged(event) {
                                if (!MidiDeviceConnectionWatcher.dispatchStateChanged) {
                                    MidiDeviceConnectionWatcher.dispatchStateChanged =
                                        Module.mono_bind_static_method("[Uno] Uno.Devices.Enumeration.Internal.Providers.Midi.MidiDeviceConnectionWatcher:DispatchStateChanged");
                                }
                                const port = event.port;
                                const isInput = port.type == "input";
                                const isConnected = port.state == "connected";
                                MidiDeviceConnectionWatcher.dispatchStateChanged(port.id, port.name, isInput, isConnected);
                            }
                        }
                        Midi.MidiDeviceConnectionWatcher = MidiDeviceConnectionWatcher;
                    })(Midi = Providers.Midi || (Providers.Midi = {}));
                })(Providers = Internal.Providers || (Internal.Providers = {}));
            })(Internal = Enumeration.Internal || (Enumeration.Internal = {}));
        })(Enumeration = Devices.Enumeration || (Devices.Enumeration = {}));
    })(Devices = Uno.Devices || (Uno.Devices = {}));
})(Uno || (Uno = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Geolocation;
        (function (Geolocation) {
            let GeolocationAccessStatus;
            (function (GeolocationAccessStatus) {
                GeolocationAccessStatus["Allowed"] = "Allowed";
                GeolocationAccessStatus["Denied"] = "Denied";
                GeolocationAccessStatus["Unspecified"] = "Unspecified";
            })(GeolocationAccessStatus || (GeolocationAccessStatus = {}));
            let PositionStatus;
            (function (PositionStatus) {
                PositionStatus["Ready"] = "Ready";
                PositionStatus["Initializing"] = "Initializing";
                PositionStatus["NoData"] = "NoData";
                PositionStatus["Disabled"] = "Disabled";
                PositionStatus["NotInitialized"] = "NotInitialized";
                PositionStatus["NotAvailable"] = "NotAvailable";
            })(PositionStatus || (PositionStatus = {}));
            class Geolocator {
                static initialize() {
                    this.positionWatches = {};
                    if (!this.dispatchAccessRequest) {
                        this.dispatchAccessRequest = Module.mono_bind_static_method("[Uno] Windows.Devices.Geolocation.Geolocator:DispatchAccessRequest");
                    }
                    if (!this.dispatchError) {
                        this.dispatchError = Module.mono_bind_static_method("[Uno] Windows.Devices.Geolocation.Geolocator:DispatchError");
                    }
                    if (!this.dispatchGeoposition) {
                        this.dispatchGeoposition = Module.mono_bind_static_method("[Uno] Windows.Devices.Geolocation.Geolocator:DispatchGeoposition");
                    }
                }
                //checks for permission to the geolocation services
                static requestAccess() {
                    Geolocator.initialize();
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((_) => {
                            Geolocator.dispatchAccessRequest(GeolocationAccessStatus.Allowed);
                        }, (error) => {
                            if (error.code == error.PERMISSION_DENIED) {
                                Geolocator.dispatchAccessRequest(GeolocationAccessStatus.Denied);
                            }
                            else if (error.code == error.POSITION_UNAVAILABLE ||
                                error.code == error.TIMEOUT) {
                                //position unavailable but we still have permission
                                Geolocator.dispatchAccessRequest(GeolocationAccessStatus.Allowed);
                            }
                            else {
                                Geolocator.dispatchAccessRequest(GeolocationAccessStatus.Unspecified);
                            }
                        }, { enableHighAccuracy: false, maximumAge: 86400000, timeout: 100 });
                    }
                    else {
                        Geolocator.dispatchAccessRequest(GeolocationAccessStatus.Denied);
                    }
                }
                //retrieves a single geoposition
                static getGeoposition(desiredAccuracyInMeters, maximumAge, timeout, requestId) {
                    Geolocator.initialize();
                    if (navigator.geolocation) {
                        this.getAccurateCurrentPosition((position) => Geolocator.handleGeoposition(position, requestId), (error) => Geolocator.handleError(error, requestId), desiredAccuracyInMeters, {
                            enableHighAccuracy: desiredAccuracyInMeters < 50,
                            maximumAge: maximumAge,
                            timeout: timeout
                        });
                    }
                    else {
                        Geolocator.dispatchError(PositionStatus.NotAvailable, requestId);
                    }
                }
                static startPositionWatch(desiredAccuracyInMeters, requestId) {
                    Geolocator.initialize();
                    if (navigator.geolocation) {
                        Geolocator.positionWatches[requestId] = navigator.geolocation.watchPosition((position) => Geolocator.handleGeoposition(position, requestId), (error) => Geolocator.handleError(error, requestId));
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                static stopPositionWatch(desiredAccuracyInMeters, requestId) {
                    navigator.geolocation.clearWatch(Geolocator.positionWatches[requestId]);
                    delete Geolocator.positionWatches[requestId];
                }
                static handleGeoposition(position, requestId) {
                    var serializedGeoposition = position.coords.latitude + ":" +
                        position.coords.longitude + ":" +
                        position.coords.altitude + ":" +
                        position.coords.altitudeAccuracy + ":" +
                        position.coords.accuracy + ":" +
                        position.coords.heading + ":" +
                        position.coords.speed + ":" +
                        position.timestamp;
                    Geolocator.dispatchGeoposition(serializedGeoposition, requestId);
                }
                static handleError(error, requestId) {
                    if (error.code == error.TIMEOUT) {
                        Geolocator.dispatchError(PositionStatus.NoData, requestId);
                    }
                    else if (error.code == error.PERMISSION_DENIED) {
                        Geolocator.dispatchError(PositionStatus.Disabled, requestId);
                    }
                    else if (error.code == error.POSITION_UNAVAILABLE) {
                        Geolocator.dispatchError(PositionStatus.NotAvailable, requestId);
                    }
                }
                //this attempts to squeeze out the requested accuracy from the GPS by utilizing the set timeout
                //adapted from https://github.com/gregsramblings/getAccurateCurrentPosition/blob/master/geo.js		
                static getAccurateCurrentPosition(geolocationSuccess, geolocationError, desiredAccuracy, options) {
                    var lastCheckedPosition;
                    var locationEventCount = 0;
                    var watchId;
                    var timerId;
                    var checkLocation = function (position) {
                        lastCheckedPosition = position;
                        locationEventCount = locationEventCount + 1;
                        //is the accuracy enough?
                        if (position.coords.accuracy <= desiredAccuracy) {
                            clearTimeout(timerId);
                            navigator.geolocation.clearWatch(watchId);
                            foundPosition(position);
                        }
                    };
                    var stopTrying = function () {
                        navigator.geolocation.clearWatch(watchId);
                        foundPosition(lastCheckedPosition);
                    };
                    var onError = function (error) {
                        clearTimeout(timerId);
                        navigator.geolocation.clearWatch(watchId);
                        geolocationError(error);
                    };
                    var foundPosition = function (position) {
                        geolocationSuccess(position);
                    };
                    watchId = navigator.geolocation.watchPosition(checkLocation, onError, options);
                    timerId = setTimeout(stopTrying, options.timeout);
                }
                ;
            }
            Geolocation.Geolocator = Geolocator;
        })(Geolocation = Devices.Geolocation || (Devices.Geolocation = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Input;
        (function (Input) {
            let PointerDeviceType;
            (function (PointerDeviceType) {
                PointerDeviceType[PointerDeviceType["Touch"] = 0] = "Touch";
                PointerDeviceType[PointerDeviceType["Pen"] = 1] = "Pen";
                PointerDeviceType[PointerDeviceType["Mouse"] = 2] = "Mouse";
            })(PointerDeviceType = Input.PointerDeviceType || (Input.PointerDeviceType = {}));
        })(Input = Devices.Input || (Devices.Input = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Midi;
        (function (Midi) {
            class MidiInPort {
                constructor(managedId, inputPort) {
                    this.messageReceived = (event) => {
                        var serializedMessage = event.data[0].toString();
                        for (var i = 1; i < event.data.length; i++) {
                            serializedMessage += ':' + event.data[i];
                        }
                        MidiInPort.dispatchMessage(this.managedId, serializedMessage, event.timeStamp);
                    };
                    this.managedId = managedId;
                    this.inputPort = inputPort;
                }
                static createPort(managedId, encodedDeviceId) {
                    const midi = Uno.Devices.Midi.Internal.WasmMidiAccess.getMidi();
                    const deviceId = decodeURIComponent(encodedDeviceId);
                    const input = midi.inputs.get(deviceId);
                    MidiInPort.instanceMap[managedId] = new MidiInPort(managedId, input);
                }
                static removePort(managedId) {
                    MidiInPort.stopMessageListener(managedId);
                    delete MidiInPort.instanceMap[managedId];
                }
                static startMessageListener(managedId) {
                    if (!MidiInPort.dispatchMessage) {
                        MidiInPort.dispatchMessage = Module.mono_bind_static_method("[Uno] Windows.Devices.Midi.MidiInPort:DispatchMessage");
                    }
                    const instance = MidiInPort.instanceMap[managedId];
                    instance.inputPort.addEventListener("midimessage", instance.messageReceived);
                }
                static stopMessageListener(managedId) {
                    const instance = MidiInPort.instanceMap[managedId];
                    instance.inputPort.removeEventListener("midimessage", instance.messageReceived);
                }
            }
            MidiInPort.instanceMap = {};
            Midi.MidiInPort = MidiInPort;
        })(Midi = Devices.Midi || (Devices.Midi = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Midi;
        (function (Midi) {
            class MidiOutPort {
                static sendBuffer(encodedDeviceId, timestamp, ...args) {
                    const midi = Uno.Devices.Midi.Internal.WasmMidiAccess.getMidi();
                    const deviceId = decodeURIComponent(encodedDeviceId);
                    const output = midi.outputs.get(deviceId);
                    output.send(args, timestamp);
                }
            }
            Midi.MidiOutPort = MidiOutPort;
        })(Midi = Devices.Midi || (Devices.Midi = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Uno;
(function (Uno) {
    var Devices;
    (function (Devices) {
        var Midi;
        (function (Midi) {
            var Internal;
            (function (Internal) {
                class WasmMidiAccess {
                    static request(systemExclusive) {
                        if (navigator.requestMIDIAccess) {
                            return navigator.requestMIDIAccess({ sysex: systemExclusive })
                                .then((midi) => {
                                WasmMidiAccess.midiAccess = midi;
                                return "true";
                            }, () => "false");
                        }
                        else {
                            return Promise.resolve("false");
                        }
                    }
                    static getMidi() {
                        return WasmMidiAccess.midiAccess;
                    }
                }
                Internal.WasmMidiAccess = WasmMidiAccess;
            })(Internal = Midi.Internal || (Midi.Internal = {}));
        })(Midi = Devices.Midi || (Devices.Midi = {}));
    })(Devices = Uno.Devices || (Uno.Devices = {}));
})(Uno || (Uno = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Sensors;
        (function (Sensors) {
            class Accelerometer {
                static initialize() {
                    if (window.DeviceMotionEvent) {
                        this.dispatchReading = Module.mono_bind_static_method("[Uno] Windows.Devices.Sensors.Accelerometer:DispatchReading");
                        return true;
                    }
                    return false;
                }
                static startReading() {
                    window.addEventListener("devicemotion", Accelerometer.readingChangedHandler);
                }
                static stopReading() {
                    window.removeEventListener("devicemotion", Accelerometer.readingChangedHandler);
                }
                static readingChangedHandler(event) {
                    Accelerometer.dispatchReading(event.accelerationIncludingGravity.x, event.accelerationIncludingGravity.y, event.accelerationIncludingGravity.z);
                }
            }
            Sensors.Accelerometer = Accelerometer;
        })(Sensors = Devices.Sensors || (Devices.Sensors = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Sensors;
        (function (Sensors) {
            class Gyrometer {
                static initialize() {
                    try {
                        if (typeof window.Gyroscope === "function") {
                            this.dispatchReading = Module.mono_bind_static_method("[Uno] Windows.Devices.Sensors.Gyrometer:DispatchReading");
                            let GyroscopeClass = window.Gyroscope;
                            this.gyroscope = new GyroscopeClass({ referenceFrame: "device" });
                            return true;
                        }
                    }
                    catch (error) {
                        //sensor not available
                        console.log("Gyroscope could not be initialized.");
                    }
                    return false;
                }
                static startReading() {
                    this.gyroscope.addEventListener("reading", Gyrometer.readingChangedHandler);
                    this.gyroscope.start();
                }
                static stopReading() {
                    this.gyroscope.removeEventListener("reading", Gyrometer.readingChangedHandler);
                    this.gyroscope.stop();
                }
                static readingChangedHandler(event) {
                    Gyrometer.dispatchReading(Gyrometer.gyroscope.x, Gyrometer.gyroscope.y, Gyrometer.gyroscope.z);
                }
            }
            Sensors.Gyrometer = Gyrometer;
        })(Sensors = Devices.Sensors || (Devices.Sensors = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Sensors;
        (function (Sensors) {
            class LightSensor {
                static initialize() {
                    try {
                        if (typeof window.AmbientLightSensor === "function") {
                            LightSensor.dispatchReading = Module.mono_bind_static_method("[Uno] Windows.Devices.Sensors.LightSensor:DispatchReading");
                            const AmbientLightSensorClass = window.AmbientLightSensor;
                            LightSensor.ambientLightSensor = new AmbientLightSensorClass();
                            return true;
                        }
                    }
                    catch (error) {
                        // Sensor not available
                        console.error("AmbientLightSensor could not be initialized.");
                    }
                    return false;
                }
                static startReading() {
                    LightSensor.ambientLightSensor.addEventListener("reading", LightSensor.readingChangedHandler);
                    LightSensor.ambientLightSensor.start();
                }
                static stopReading() {
                    LightSensor.ambientLightSensor.removeEventListener("reading", LightSensor.readingChangedHandler);
                    LightSensor.ambientLightSensor.stop();
                }
                static readingChangedHandler(event) {
                    LightSensor.dispatchReading(LightSensor.ambientLightSensor.illuminance);
                }
            }
            Sensors.LightSensor = LightSensor;
        })(Sensors = Devices.Sensors || (Devices.Sensors = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Devices;
    (function (Devices) {
        var Sensors;
        (function (Sensors) {
            class Magnetometer {
                static initialize() {
                    try {
                        if (typeof window.Magnetometer === "function") {
                            this.dispatchReading = Module.mono_bind_static_method("[Uno] Windows.Devices.Sensors.Magnetometer:DispatchReading");
                            let MagnetometerClass = window.Magnetometer;
                            this.magnetometer = new MagnetometerClass({ referenceFrame: 'device' });
                            return true;
                        }
                    }
                    catch (error) {
                        //sensor not available
                        console.log("Magnetometer could not be initialized.");
                    }
                    return false;
                }
                static startReading() {
                    this.magnetometer.addEventListener("reading", Magnetometer.readingChangedHandler);
                    this.magnetometer.start();
                }
                static stopReading() {
                    this.magnetometer.removeEventListener("reading", Magnetometer.readingChangedHandler);
                    this.magnetometer.stop();
                }
                static readingChangedHandler(event) {
                    Magnetometer.dispatchReading(Magnetometer.magnetometer.x, Magnetometer.magnetometer.y, Magnetometer.magnetometer.z);
                }
            }
            Sensors.Magnetometer = Magnetometer;
        })(Sensors = Devices.Sensors || (Devices.Sensors = {}));
    })(Devices = Windows.Devices || (Windows.Devices = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Gaming;
    (function (Gaming) {
        var Input;
        (function (Input) {
            class Gamepad {
                static getConnectedGamepadIds() {
                    const gamepads = navigator.getGamepads();
                    const separator = ";";
                    var result = '';
                    for (var gamepad of gamepads) {
                        if (gamepad) {
                            result += gamepad.index + separator;
                        }
                    }
                    return result;
                }
                static getReading(id) {
                    var gamepad = navigator.getGamepads()[id];
                    if (!gamepad) {
                        return "";
                    }
                    var result = "";
                    result += gamepad.timestamp;
                    result += '*';
                    for (var axisId = 0; axisId < gamepad.axes.length; axisId++) {
                        if (axisId != 0) {
                            result += '|';
                        }
                        result += gamepad.axes[axisId];
                    }
                    result += '*';
                    for (var buttonId = 0; buttonId < gamepad.buttons.length; buttonId++) {
                        if (buttonId != 0) {
                            result += '|';
                        }
                        result += gamepad.buttons[buttonId].value;
                    }
                    return result;
                }
                static startGamepadAdded() {
                    window.addEventListener("gamepadconnected", Gamepad.onGamepadConnected);
                }
                static endGamepadAdded() {
                    window.removeEventListener("gamepadconnected", Gamepad.onGamepadConnected);
                }
                static startGamepadRemoved() {
                    window.addEventListener("gamepaddisconnected", Gamepad.onGamepadDisconnected);
                }
                static endGamepadRemoved() {
                    window.removeEventListener("gamepaddisconnected", Gamepad.onGamepadDisconnected);
                }
                static onGamepadConnected(e) {
                    if (!Gamepad.dispatchGamepadAdded) {
                        Gamepad.dispatchGamepadAdded = Module.mono_bind_static_method("[Uno] Windows.Gaming.Input.Gamepad:DispatchGamepadAdded");
                    }
                    Gamepad.dispatchGamepadAdded(e.gamepad.index.toString());
                }
                static onGamepadDisconnected(e) {
                    if (!Gamepad.dispatchGamepadRemoved) {
                        Gamepad.dispatchGamepadRemoved = Module.mono_bind_static_method("[Uno] Windows.Gaming.Input.Gamepad:DispatchGamepadRemoved");
                    }
                    Gamepad.dispatchGamepadRemoved(e.gamepad.index.toString());
                }
            }
            Input.Gamepad = Gamepad;
        })(Input = Gaming.Input || (Gaming.Input = {}));
    })(Gaming = Windows.Gaming || (Windows.Gaming = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Graphics;
    (function (Graphics) {
        var Display;
        (function (Display) {
            class DisplayInformation {
                static startOrientationChanged() {
                    window.screen.orientation.addEventListener("change", DisplayInformation.onOrientationChange);
                }
                static stopOrientationChanged() {
                    window.screen.orientation.removeEventListener("change", DisplayInformation.onOrientationChange);
                }
                static startDpiChanged() {
                    // DPI can be observed using matchMedia query, but only for certain breakpoints
                    // for accurate observation, we use polling
                    DisplayInformation.lastDpi = window.devicePixelRatio;
                    // start polling the devicePixel
                    DisplayInformation.dpiWatcher = window.setInterval(DisplayInformation.updateDpi, DisplayInformation.DpiCheckInterval);
                }
                static stopDpiChanged() {
                    window.clearInterval(DisplayInformation.dpiWatcher);
                }
                static updateDpi() {
                    const currentDpi = window.devicePixelRatio;
                    if (Math.abs(DisplayInformation.lastDpi - currentDpi) > 0.001) {
                        if (DisplayInformation.dispatchDpiChanged == null) {
                            DisplayInformation.dispatchDpiChanged =
                                Module.mono_bind_static_method("[Uno] Windows.Graphics.Display.DisplayInformation:DispatchDpiChanged");
                        }
                        DisplayInformation.dispatchDpiChanged(currentDpi);
                    }
                    DisplayInformation.lastDpi = currentDpi;
                }
                static onOrientationChange() {
                    if (DisplayInformation.dispatchOrientationChanged == null) {
                        DisplayInformation.dispatchOrientationChanged =
                            Module.mono_bind_static_method("[Uno] Windows.Graphics.Display.DisplayInformation:DispatchOrientationChanged");
                    }
                    DisplayInformation.dispatchOrientationChanged(window.screen.orientation.type);
                }
            }
            DisplayInformation.DpiCheckInterval = 1000;
            Display.DisplayInformation = DisplayInformation;
        })(Display = Graphics.Display || (Graphics.Display = {}));
    })(Graphics = Windows.Graphics || (Windows.Graphics = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Media;
    (function (Media) {
        class SpeechRecognizer {
            constructor(managedId, culture) {
                this.onResult = (event) => {
                    if (event.results[0].isFinal) {
                        if (!SpeechRecognizer.dispatchResult) {
                            SpeechRecognizer.dispatchResult = Module.mono_bind_static_method("[Uno] Windows.Media.SpeechRecognition.SpeechRecognizer:DispatchResult");
                        }
                        SpeechRecognizer.dispatchResult(this.managedId, event.results[0][0].transcript, event.results[0][0].confidence);
                    }
                    else {
                        if (!SpeechRecognizer.dispatchHypothesis) {
                            SpeechRecognizer.dispatchHypothesis = Module.mono_bind_static_method("[Uno] Windows.Media.SpeechRecognition.SpeechRecognizer:DispatchHypothesis");
                        }
                        SpeechRecognizer.dispatchHypothesis(this.managedId, event.results[0][0].transcript);
                    }
                };
                this.onSpeechStart = () => {
                    if (!SpeechRecognizer.dispatchStatus) {
                        SpeechRecognizer.dispatchStatus = Module.mono_bind_static_method("[Uno] Windows.Media.SpeechRecognition.SpeechRecognizer:DispatchStatus");
                    }
                    SpeechRecognizer.dispatchStatus(this.managedId, "SpeechDetected");
                };
                this.onError = (event) => {
                    if (!SpeechRecognizer.dispatchError) {
                        SpeechRecognizer.dispatchError = Module.mono_bind_static_method("[Uno] Windows.Media.SpeechRecognition.SpeechRecognizer:DispatchError");
                    }
                    SpeechRecognizer.dispatchError(this.managedId, event.error);
                };
                this.managedId = managedId;
                if (window.SpeechRecognition) {
                    this.recognition = new window.SpeechRecognition(culture);
                }
                else if (window.webkitSpeechRecognition) {
                    this.recognition = new window.webkitSpeechRecognition(culture);
                }
                if (this.recognition) {
                    this.recognition.addEventListener("result", this.onResult);
                    this.recognition.addEventListener("speechstart", this.onSpeechStart);
                    this.recognition.addEventListener("error", this.onError);
                }
            }
            static initialize(managedId, culture) {
                const recognizer = new SpeechRecognizer(managedId, culture);
                SpeechRecognizer.instanceMap[managedId] = recognizer;
            }
            static recognize(managedId) {
                const recognizer = SpeechRecognizer.instanceMap[managedId];
                if (recognizer.recognition) {
                    recognizer.recognition.continuous = false;
                    recognizer.recognition.interimResults = true;
                    recognizer.recognition.start();
                    return true;
                }
                else {
                    return false;
                }
            }
            static removeInstance(managedId) {
                const recognizer = SpeechRecognizer.instanceMap[managedId];
                recognizer.recognition.removeEventListener("result", recognizer.onResult);
                recognizer.recognition.removeEventListener("speechstart", recognizer.onSpeechStart);
                recognizer.recognition.removeEventListener("error", recognizer.onError);
                delete SpeechRecognizer.instanceMap[managedId];
            }
        }
        SpeechRecognizer.instanceMap = {};
        Media.SpeechRecognizer = SpeechRecognizer;
    })(Media = Windows.Media || (Windows.Media = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Networking;
    (function (Networking) {
        var Connectivity;
        (function (Connectivity) {
            class ConnectionProfile {
                static hasInternetAccess() {
                    return navigator.onLine;
                }
            }
            Connectivity.ConnectionProfile = ConnectionProfile;
        })(Connectivity = Networking.Connectivity || (Networking.Connectivity = {}));
    })(Networking = Windows.Networking || (Windows.Networking = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Networking;
    (function (Networking) {
        var Connectivity;
        (function (Connectivity) {
            class NetworkInformation {
                static startStatusChanged() {
                    window.addEventListener("online", NetworkInformation.networkStatusChanged);
                    window.addEventListener("offline", NetworkInformation.networkStatusChanged);
                }
                static stopStatusChanged() {
                    window.removeEventListener("online", NetworkInformation.networkStatusChanged);
                    window.removeEventListener("offline", NetworkInformation.networkStatusChanged);
                }
                static networkStatusChanged() {
                    if (NetworkInformation.dispatchStatusChanged == null) {
                        NetworkInformation.dispatchStatusChanged =
                            Module.mono_bind_static_method("[Uno] Windows.Networking.Connectivity.NetworkInformation:DispatchStatusChanged");
                    }
                    NetworkInformation.dispatchStatusChanged();
                }
            }
            Connectivity.NetworkInformation = NetworkInformation;
        })(Connectivity = Networking.Connectivity || (Networking.Connectivity = {}));
    })(Networking = Windows.Networking || (Windows.Networking = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Phone;
    (function (Phone) {
        var Devices;
        (function (Devices) {
            var Notification;
            (function (Notification) {
                class VibrationDevice {
                    static initialize() {
                        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
                        if (navigator.vibrate) {
                            return true;
                        }
                        return false;
                    }
                    static vibrate(duration) {
                        return window.navigator.vibrate(duration);
                    }
                }
                Notification.VibrationDevice = VibrationDevice;
            })(Notification = Devices.Notification || (Devices.Notification = {}));
        })(Devices = Phone.Devices || (Phone.Devices = {}));
    })(Phone = Windows.Phone || (Windows.Phone = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Security;
    (function (Security) {
        var Authentication;
        (function (Authentication) {
            var Web;
            (function (Web) {
                class WebAuthenticationBroker {
                    static getReturnUrl() {
                        return window.location.origin;
                    }
                    static authenticateUsingIframe(iframeId, urlNavigate, urlRedirect, timeout) {
                        return new Promise((ok, err) => {
                            let iframe;
                            if (iframeId) {
                                iframe = document.getElementById(iframeId);
                            }
                            if (!iframe) {
                                iframe = document.createElement("iframe");
                                iframe.style.opacity = "0";
                                iframe.style.pointerEvents = "none";
                                document.body.append(iframe);
                            }
                            const terminate = () => {
                                iframe.removeEventListener("load", onload);
                                iframe.src = "about:blank";
                                if (!iframeId) {
                                    iframe.remove();
                                }
                            };
                            const onload = () => {
                                if (!iframe.contentDocument) {
                                    return; // can't access right now
                                }
                                const currentUrl = iframe.contentDocument.URL;
                                console.log("iframe src=" + currentUrl);
                                if (currentUrl.indexOf(urlRedirect) === 0) {
                                    terminate();
                                    ok(`success|${currentUrl}`);
                                }
                            };
                            iframe.addEventListener("load", onload);
                            iframe.src = urlNavigate;
                        });
                    }
                    static authenticateUsingWindow(urlNavigate, urlRedirect, title, popUpWidth, popUpHeight, timeout) {
                        let win = null;
                        let timerSubscription = null;
                        return new Promise((ok, err) => {
                            let finished = false;
                            const close = () => {
                                if (win) {
                                    win.close();
                                    win = null;
                                }
                                if (timerSubscription) {
                                    window.clearInterval(timerSubscription);
                                    timerSubscription = null;
                                }
                                if (!finished) {
                                    err("Incomplete");
                                }
                            };
                            const completeSuccessfully = (url) => {
                                if (!finished) {
                                    ok(`success|${url}`);
                                    finished = true;
                                    close();
                                }
                            };
                            const completeUserCancel = () => {
                                if (!finished) {
                                    ok(`cancel`);
                                    finished = true;
                                    close();
                                }
                            };
                            const completeTimeout = () => {
                                if (!finished) {
                                    ok(`timeout`);
                                    finished = true;
                                    close();
                                }
                            };
                            const completeWithError = (error) => {
                                if (!finished) {
                                    err(error);
                                    finished = true;
                                    close();
                                }
                            };
                            try {
                                /**
                                 * adding winLeft and winTop to account for dual monitor
                                 * using screenLeft and screenTop for IE8 and earlier
                                 */
                                const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
                                const winTop = window.screenTop ? window.screenTop : window.screenY;
                                /**
                                 * window.innerWidth displays browser window"s height and width excluding toolbars
                                 * using document.documentElement.clientWidth for IE8 and earlier
                                 */
                                const width = window.innerWidth ||
                                    document.documentElement.clientWidth ||
                                    document.body.clientWidth;
                                const height = window.innerHeight ||
                                    document.documentElement.clientHeight ||
                                    document.body.clientHeight;
                                const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
                                const top = ((height / 2) - (popUpHeight / 2)) + winTop;
                                // open the window
                                win = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top + ", left=" + left);
                                if (!win) {
                                    completeWithError("Can't open window");
                                    return;
                                }
                                if (win.focus) {
                                    win.focus();
                                }
                                win.addEventListener("beforeunload", close);
                                const onFinalUrlReached = (success, timedout, finalUrlOrMessage) => {
                                    if (success) {
                                        completeSuccessfully(finalUrlOrMessage);
                                    }
                                    else {
                                        if (timedout) {
                                            completeTimeout();
                                        }
                                        else {
                                            completeUserCancel();
                                        }
                                    }
                                };
                                timerSubscription = this.startMonitoringRedirect(win, urlRedirect, timeout, onFinalUrlReached);
                            }
                            catch (e) {
                                completeWithError(`${e}`);
                            }
                        });
                    }
                    static startMonitoringRedirect(win, urlRedirect, timeout, callback) {
                        const currentTime = (new Date()).getTime();
                        const maxTime = currentTime + timeout;
                        const subscription = window.setInterval(() => {
                            try {
                                if ((new Date()).getTime() > maxTime) {
                                    callback(false, true, null);
                                }
                                if (win.closed) {
                                    callback(false, false, "Popup closed");
                                    return;
                                }
                                const url = win.document.URL;
                                if (url.indexOf(urlRedirect) === 0) {
                                    callback(true, false, url);
                                }
                            }
                            catch (e) {
                                // Expected! DOMException / crossed origin until reached correct redirect page
                            }
                        }, 100);
                        return subscription;
                    }
                }
                Web.WebAuthenticationBroker = WebAuthenticationBroker;
            })(Web = Authentication.Web || (Authentication.Web = {}));
        })(Authentication = Security.Authentication || (Security.Authentication = {}));
    })(Security = Windows.Security || (Windows.Security = {}));
})(Windows || (Windows = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer {
            static buildStorageKey(locality, key) {
                return `UnoApplicationDataContainer_${locality}_${key}`;
            }
            static buildStoragePrefix(locality) {
                return `UnoApplicationDataContainer_${locality}_`;
            }
            /**
             * Try to get a value from localStorage
             * */
            static tryGetValue(pParams, pReturn) {
                const params = Storage.ApplicationDataContainer_TryGetValueParams.unmarshal(pParams);
                const ret = new Storage.ApplicationDataContainer_TryGetValueReturn();
                const storageKey = ApplicationDataContainer.buildStorageKey(params.Locality, params.Key);
                if (localStorage.hasOwnProperty(storageKey)) {
                    ret.HasValue = true;
                    ret.Value = localStorage.getItem(storageKey);
                }
                else {
                    ret.Value = "";
                    ret.HasValue = false;
                }
                ret.marshal(pReturn);
                return true;
            }
            /**
             * Set a value to localStorage
             * */
            static setValue(pParams) {
                const params = Storage.ApplicationDataContainer_SetValueParams.unmarshal(pParams);
                const storageKey = ApplicationDataContainer.buildStorageKey(params.Locality, params.Key);
                localStorage.setItem(storageKey, params.Value);
                return true;
            }
            /**
             * Determines if a key is contained in localStorage
             * */
            static containsKey(pParams, pReturn) {
                const params = Storage.ApplicationDataContainer_ContainsKeyParams.unmarshal(pParams);
                const ret = new Storage.ApplicationDataContainer_ContainsKeyReturn();
                const storageKey = ApplicationDataContainer.buildStorageKey(params.Locality, params.Key);
                ret.ContainsKey = localStorage.hasOwnProperty(storageKey);
                ret.marshal(pReturn);
                return true;
            }
            /**
             * Gets a key by index in localStorage
             * */
            static getKeyByIndex(pParams, pReturn) {
                const params = Storage.ApplicationDataContainer_GetKeyByIndexParams.unmarshal(pParams);
                const ret = new Storage.ApplicationDataContainer_GetKeyByIndexReturn();
                let localityIndex = 0;
                let returnKey = "";
                const prefix = ApplicationDataContainer.buildStoragePrefix(params.Locality);
                for (let i = 0; i < localStorage.length; i++) {
                    const storageKey = localStorage.key(i);
                    if (storageKey.startsWith(prefix)) {
                        if (localityIndex === params.Index) {
                            returnKey = storageKey.substr(prefix.length);
                        }
                        localityIndex++;
                    }
                }
                ret.Value = returnKey;
                ret.marshal(pReturn);
                return true;
            }
            /**
             * Determines the number of items contained in localStorage
             * */
            static getCount(pParams, pReturn) {
                const params = Storage.ApplicationDataContainer_GetCountParams.unmarshal(pParams);
                const ret = new Storage.ApplicationDataContainer_GetCountReturn();
                ret.Count = 0;
                const prefix = ApplicationDataContainer.buildStoragePrefix(params.Locality);
                for (let i = 0; i < localStorage.length; i++) {
                    const storageKey = localStorage.key(i);
                    if (storageKey.startsWith(prefix)) {
                        ret.Count++;
                    }
                }
                ret.marshal(pReturn);
                return true;
            }
            /**
             * Clears items contained in localStorage
             * */
            static clear(pParams) {
                const params = Storage.ApplicationDataContainer_ClearParams.unmarshal(pParams);
                const prefix = ApplicationDataContainer.buildStoragePrefix(params.Locality);
                const itemsToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const storageKey = localStorage.key(i);
                    if (storageKey.startsWith(prefix)) {
                        itemsToRemove.push(storageKey);
                    }
                }
                for (const item in itemsToRemove) {
                    localStorage.removeItem(itemsToRemove[item]);
                }
                return true;
            }
            /**
             * Removes an item contained in localStorage
             * */
            static remove(pParams, pReturn) {
                const params = Storage.ApplicationDataContainer_RemoveParams.unmarshal(pParams);
                const ret = new Storage.ApplicationDataContainer_RemoveReturn();
                const storageKey = ApplicationDataContainer.buildStorageKey(params.Locality, params.Key);
                ret.Removed = localStorage.hasOwnProperty(storageKey);
                if (ret.Removed) {
                    localStorage.removeItem(storageKey);
                }
                ret.marshal(pReturn);
                return true;
            }
            /**
             * Gets a key by index in localStorage
             * */
            static getValueByIndex(pParams, pReturn) {
                const params = Storage.ApplicationDataContainer_GetValueByIndexParams.unmarshal(pParams);
                const ret = new Storage.ApplicationDataContainer_GetKeyByIndexReturn();
                let localityIndex = 0;
                let returnKey = "";
                const prefix = ApplicationDataContainer.buildStoragePrefix(params.Locality);
                for (let i = 0; i < localStorage.length; i++) {
                    const storageKey = localStorage.key(i);
                    if (storageKey.startsWith(prefix)) {
                        if (localityIndex === params.Index) {
                            returnKey = localStorage.getItem(storageKey);
                        }
                        localityIndex++;
                    }
                }
                ret.Value = returnKey;
                ret.marshal(pReturn);
                return true;
            }
        }
        Storage.ApplicationDataContainer = ApplicationDataContainer;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class AssetManager {
            static async DownloadAssetsManifest(path) {
                const response = await fetch(path);
                return response.text();
            }
            static async DownloadAsset(path) {
                const response = await fetch(path);
                const arrayBuffer = await response.blob().then(b => b.arrayBuffer());
                const size = arrayBuffer.byteLength;
                const responseArray = new Uint8ClampedArray(arrayBuffer);
                const pData = Module._malloc(size);
                Module.HEAPU8.set(responseArray, pData);
                return `${pData};${size}`;
            }
        }
        Storage.AssetManager = AssetManager;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        class NativeStorageFile {
            static async getBasicPropertiesAsync(guid) {
                const file = await Storage.NativeStorageItem.getFile(guid);
                var propertyString = "";
                propertyString += file.size;
                propertyString += "|";
                propertyString += file.lastModified;
                return propertyString;
            }
        }
        Storage.NativeStorageFile = NativeStorageFile;
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        class NativeStorageFolder {
            /**
             * Creates a new folder inside another folder.
             * @param parentGuid The GUID of the folder to create in.
             * @param folderName The name of the new folder.
             */
            static async createFolderAsync(parentGuid, folderName) {
                try {
                    const parentHandle = Storage.NativeStorageItem.getItem(parentGuid);
                    const newDirectoryHandle = await parentHandle.getDirectoryHandle(folderName, {
                        create: true,
                    });
                    const info = Storage.NativeStorageItem.getInfos(newDirectoryHandle)[0];
                    return JSON.stringify(info);
                }
                catch (_a) {
                    console.log("Could not create folder" + folderName);
                    return null;
                }
            }
            /**
             * Creates a new file inside another folder.
             * @param parentGuid The GUID of the folder to create in.
             * @param folderName The name of the new file.
             */
            static async createFileAsync(parentGuid, fileName) {
                try {
                    const parentHandle = Storage.NativeStorageItem.getItem(parentGuid);
                    const newFileHandle = await parentHandle.getFileHandle(fileName, {
                        create: true,
                    });
                    const info = Storage.NativeStorageItem.getInfos(newFileHandle)[0];
                    return JSON.stringify(info);
                }
                catch (_a) {
                    console.log("Could not create file " + fileName);
                    return null;
                }
            }
            /**
             * Tries to get a folder in the given parent folder by name.
             * @param parentGuid The GUID of the parent folder to get.
             * @param folderName The name of the folder to look for.
             * @returns A GUID of the folder if found, otherwise null.
             */
            static async tryGetFolderAsync(parentGuid, folderName) {
                const parentHandle = Storage.NativeStorageItem.getItem(parentGuid);
                let nestedDirectoryHandle = undefined;
                try {
                    nestedDirectoryHandle = await parentHandle.getDirectoryHandle(folderName);
                }
                catch (ex) {
                    return null;
                }
                if (nestedDirectoryHandle) {
                    return JSON.stringify(Storage.NativeStorageItem.getInfos(nestedDirectoryHandle)[0]);
                }
                return null;
            }
            /**
            * Tries to get a file in the given parent folder by name.
            * @param parentGuid The GUID of the parent folder to get.
            * @param folderName The name of the folder to look for.
            * @returns A GUID of the folder if found, otherwise null.
            */
            static async tryGetFileAsync(parentGuid, fileName) {
                const parentHandle = Storage.NativeStorageItem.getItem(parentGuid);
                let fileHandle = undefined;
                try {
                    fileHandle = await parentHandle.getFileHandle(fileName);
                }
                catch (ex) {
                    return null;
                }
                if (fileHandle) {
                    return JSON.stringify(Storage.NativeStorageItem.getInfos(fileHandle)[0]);
                }
                return null;
            }
            static async deleteItemAsync(parentGuid, itemName) {
                try {
                    const parentHandle = Storage.NativeStorageItem.getItem(parentGuid);
                    await parentHandle.removeEntry(itemName, { recursive: true });
                    return "OK";
                }
                catch (_a) {
                    return null;
                }
            }
            static async getItemsAsync(folderGuid) {
                return await NativeStorageFolder.getEntriesAsync(folderGuid, true, true);
            }
            static async getFoldersAsync(folderGuid) {
                return await NativeStorageFolder.getEntriesAsync(folderGuid, false, true);
            }
            static async getFilesAsync(folderGuid) {
                return await NativeStorageFolder.getEntriesAsync(folderGuid, true, false);
            }
            static async getPrivateRootAsync() {
                if (!navigator.storage.getDirectory) {
                    return null;
                }
                const directory = await navigator.storage.getDirectory();
                if (!directory) {
                    return null;
                }
                const info = Storage.NativeStorageItem.getInfos(directory)[0];
                return JSON.stringify(info);
            }
            static async getEntriesAsync(guid, includeFiles, includeDirectories) {
                var e_1, _a, e_2, _b;
                const folderHandle = Storage.NativeStorageItem.getItem(guid);
                var entries = [];
                // Default to "modern" implementation
                if (folderHandle.values) {
                    try {
                        for (var _c = __asyncValues(folderHandle.values()), _d; _d = await _c.next(), !_d.done;) {
                            var entry = _d.value;
                            entries.push(entry);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) await _a.call(_c);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                else {
                    try {
                        for (var _e = __asyncValues(folderHandle.getEntries()), _f; _f = await _e.next(), !_f.done;) {
                            var handle = _f.value;
                            entries.push(handle);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) await _b.call(_e);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                var filteredHandles = [];
                // Filter
                for (var handle of entries) {
                    if (handle.kind == "file" && includeFiles) {
                        filteredHandles.push(handle);
                    }
                    else if (handle.kind == "directory" && includeDirectories) {
                        filteredHandles.push(handle);
                    }
                }
                // Get infos
                var infos = Storage.NativeStorageItem.getInfos(...filteredHandles);
                var json = JSON.stringify(infos);
                return json;
            }
        }
        Storage.NativeStorageFolder = NativeStorageFolder;
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        class NativeStorageItem {
            static addItem(guid, item) {
                NativeStorageItem._guidToItemMap.set(guid, item);
                NativeStorageItem._itemToGuidMap.set(item, guid);
            }
            static removeItem(guid) {
                const handle = NativeStorageItem._guidToItemMap.get(guid);
                NativeStorageItem._guidToItemMap.delete(guid);
                NativeStorageItem._itemToGuidMap.delete(handle);
            }
            static getItem(guid) {
                return NativeStorageItem._guidToItemMap.get(guid);
            }
            static async getFile(guid) {
                const item = NativeStorageItem.getItem(guid);
                if (item instanceof File) {
                    return item;
                }
                if (item instanceof FileSystemFileHandle) {
                    return await item.getFile();
                }
                if (item instanceof FileSystemDirectoryHandle) {
                    throw new Error("Item " + guid + " is a directory handle. You cannot use it as a File!");
                }
                throw new Error("Item " + guid + " is of an unknown type. You cannot use it as a File!");
            }
            static getGuid(item) {
                return NativeStorageItem._itemToGuidMap.get(item);
            }
            static getInfos(...items) {
                const itemsWithoutGuids = [];
                for (const item of items) {
                    const guid = NativeStorageItem.getGuid(item);
                    if (!guid) {
                        itemsWithoutGuids.push(item);
                    }
                }
                NativeStorageItem.storeItems(itemsWithoutGuids);
                const results = [];
                for (const item of items) {
                    const guid = NativeStorageItem.getGuid(item);
                    const info = new Storage.NativeStorageItemInfo();
                    info.id = guid;
                    info.name = item.name;
                    info.isFile = item instanceof File || item.kind === "file";
                    results.push(info);
                }
                return results;
            }
            static storeItems(handles) {
                const missingGuids = NativeStorageItem.generateGuids(handles.length);
                for (let i = 0; i < handles.length; i++) {
                    NativeStorageItem.addItem(missingGuids[i], handles[i]);
                }
            }
            static generateGuids(count) {
                if (!NativeStorageItem.generateGuidBinding) {
                    NativeStorageItem.generateGuidBinding = Module.mono_bind_static_method("[Uno] Uno.Storage.NativeStorageItem:GenerateGuids");
                }
                const guids = NativeStorageItem.generateGuidBinding(count);
                return guids.split(";");
            }
        }
        NativeStorageItem._guidToItemMap = new Map();
        NativeStorageItem._itemToGuidMap = new Map();
        Storage.NativeStorageItem = NativeStorageItem;
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        class NativeStorageItemInfo {
        }
        Storage.NativeStorageItemInfo = NativeStorageItemInfo;
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class StorageFolder {
            /**
             * Determine if IndexDB is available, some browsers and modes disable it.
             * */
            static isIndexDBAvailable() {
                try {
                    // IndexedDB may not be available in private mode
                    window.indexedDB;
                    return true;
                }
                catch (err) {
                    return false;
                }
            }
            /**
             * Setup the storage persistence of a given set of paths.
             * */
            static makePersistent(pParams) {
                const params = Storage.StorageFolderMakePersistentParams.unmarshal(pParams);
                for (var i = 0; i < params.Paths.length; i++) {
                    this.setupStorage(params.Paths[i]);
                }
                // Ensure to sync pseudo file system on unload (and periodically for safety)
                if (!this._isInitialized) {
                    // Request an initial sync to populate the file system
                    StorageFolder.synchronizeFileSystem(true, () => StorageFolder.onStorageInitialized());
                    window.addEventListener("beforeunload", () => this.synchronizeFileSystem(false));
                    setInterval(() => this.synchronizeFileSystem(false), 10000);
                    this._isInitialized = true;
                }
            }
            /**
             * Setup the storage persistence of a given path.
             * */
            static setupStorage(path) {
                if (Uno.UI.WindowManager.isHosted) {
                    console.debug("Hosted Mode: skipping IndexDB initialization");
                    StorageFolder.onStorageInitialized();
                    return;
                }
                if (!this.isIndexDBAvailable()) {
                    console.warn("IndexedDB is not available (private mode or uri starts with file:// ?), changes will not be persisted.");
                    StorageFolder.onStorageInitialized();
                    return;
                }
                if (typeof IDBFS === 'undefined') {
                    console.warn(`IDBFS is not enabled in mono's configuration, persistence is disabled`);
                    StorageFolder.onStorageInitialized();
                    return;
                }
                console.debug("Making persistent: " + path);
                FS.mkdir(path);
                FS.mount(IDBFS, {}, path);
            }
            static onStorageInitialized() {
                if (!StorageFolder.dispatchStorageInitialized) {
                    StorageFolder.dispatchStorageInitialized =
                        Module.mono_bind_static_method("[Uno] Windows.Storage.StorageFolder:DispatchStorageInitialized");
                }
                StorageFolder.dispatchStorageInitialized();
            }
            /**
             * Synchronize the IDBFS memory cache back to IndexedDB
             * populate: requests the filesystem to be popuplated from the IndexedDB
             * onSynchronized: function invoked when the synchronization finished
             * */
            static synchronizeFileSystem(populate, onSynchronized = null) {
                if (!StorageFolder._isSynchronizing) {
                    StorageFolder._isSynchronizing = true;
                    FS.syncfs(populate, err => {
                        StorageFolder._isSynchronizing = false;
                        if (onSynchronized) {
                            onSynchronized();
                        }
                        if (err) {
                            console.error(`Error synchronizing filesystem from IndexDB: ${err} (errno: ${err.errno})`);
                        }
                    });
                }
            }
        }
        StorageFolder._isInitialized = false;
        StorageFolder._isSynchronizing = false;
        Storage.StorageFolder = StorageFolder;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        var Pickers;
        (function (Pickers) {
            class FileOpenPicker {
                static isNativeSupported() {
                    return typeof showOpenFilePicker === "function";
                }
                static async nativePickFilesAsync(multiple, showAllEntry, fileTypesJson, id, startIn) {
                    if (!FileOpenPicker.isNativeSupported()) {
                        return JSON.stringify([]);
                    }
                    const options = {
                        excludeAcceptAllOption: !showAllEntry,
                        id: id,
                        multiple: multiple,
                        startIn: startIn,
                        types: [],
                    };
                    const acceptTypes = JSON.parse(fileTypesJson);
                    for (const acceptType of acceptTypes) {
                        const pickerAcceptType = {
                            accept: {},
                            description: acceptType.description,
                        };
                        for (const acceptTypeItem of acceptType.accept) {
                            pickerAcceptType.accept[acceptTypeItem.mimeType] = acceptTypeItem.extensions;
                        }
                        options.types.push(pickerAcceptType);
                    }
                    try {
                        const selectedFiles = await showOpenFilePicker(options);
                        const infos = Uno.Storage.NativeStorageItem.getInfos(...selectedFiles);
                        const json = JSON.stringify(infos);
                        return json;
                    }
                    catch (e) {
                        console.log("User did not make a selection or the file selected was" +
                            "deemed too sensitive or dangerous to be exposed to the website - " + e);
                        return JSON.stringify([]);
                    }
                }
                static uploadPickFilesAsync(multiple, targetPath, accept) {
                    return new Promise((resolve, reject) => {
                        const inputElement = document.createElement("input");
                        inputElement.type = "file";
                        inputElement.multiple = multiple;
                        inputElement.accept = accept;
                        inputElement.onchange = async (e) => {
                            const existingFileNames = new Set();
                            var adjustedTargetPath = targetPath;
                            if (!adjustedTargetPath.endsWith('/')) {
                                adjustedTargetPath += '/';
                            }
                            var duplicateFileId = 0;
                            for (const file of inputElement.files) {
                                const fileBuffer = await file.arrayBuffer();
                                const fileBufferView = new Uint8Array(fileBuffer);
                                var targetFileName = "";
                                if (!existingFileNames.has(file.name)) {
                                    targetFileName = adjustedTargetPath + file.name;
                                    existingFileNames.add(file.name);
                                }
                                else {
                                    targetFileName = adjustedTargetPath + duplicateFileId + "_" + file.name;
                                    duplicateFileId++;
                                }
                                FS.writeFile(targetFileName, fileBufferView);
                            }
                            resolve(inputElement.files.length.toString());
                        };
                        inputElement.click();
                    });
                }
            }
            Pickers.FileOpenPicker = FileOpenPicker;
        })(Pickers = Storage.Pickers || (Storage.Pickers = {}));
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        var Pickers;
        (function (Pickers) {
            class FileSavePicker {
                static isNativeSupported() {
                    return typeof showSaveFilePicker === "function";
                }
                static async nativePickSaveFileAsync(showAllEntry, fileTypesJson, suggestedFileName, id, startIn) {
                    if (!FileSavePicker.isNativeSupported()) {
                        return null;
                    }
                    const options = {
                        excludeAcceptAllOption: !showAllEntry,
                        id: id,
                        startIn: startIn,
                        types: [],
                    };
                    if (suggestedFileName != "") {
                        options.suggestedName = suggestedFileName;
                    }
                    const acceptTypes = JSON.parse(fileTypesJson);
                    for (const acceptType of acceptTypes) {
                        const pickerAcceptType = {
                            accept: {},
                            description: acceptType.description,
                        };
                        for (const acceptTypeItem of acceptType.accept) {
                            pickerAcceptType.accept[acceptTypeItem.mimeType] = acceptTypeItem.extensions;
                        }
                        options.types.push(pickerAcceptType);
                    }
                    try {
                        const selectedFile = await showSaveFilePicker(options);
                        const info = Uno.Storage.NativeStorageItem.getInfos(selectedFile)[0];
                        const json = JSON.stringify(info);
                        return json;
                    }
                    catch (e) {
                        console.log("User did not make a selection or the file selected was" +
                            "deemed too sensitive or dangerous to be exposed to the website - " + e);
                        return null;
                    }
                }
                static SaveAs(fileName, dataPtr, size) {
                    const buffer = new Uint8Array(size);
                    for (var i = 0; i < size; i++) {
                        buffer[i] = Module.getValue(dataPtr + i, "i8");
                    }
                    const a = window.document.createElement('a');
                    const blob = new Blob([buffer]);
                    a.href = window.URL.createObjectURL(blob);
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
            Pickers.FileSavePicker = FileSavePicker;
        })(Pickers = Storage.Pickers || (Storage.Pickers = {}));
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        var Pickers;
        (function (Pickers) {
            class FolderPicker {
                static isNativeSupported() {
                    return typeof showDirectoryPicker === "function";
                }
                static async pickSingleFolderAsync(id, startIn) {
                    if (!FolderPicker.isNativeSupported()) {
                        return null;
                    }
                    try {
                        const options = {
                            id: id,
                            startIn: startIn,
                        };
                        const selectedFolder = await showDirectoryPicker(options);
                        const info = Uno.Storage.NativeStorageItem.getInfos(selectedFolder)[0];
                        return JSON.stringify(info);
                    }
                    catch (e) {
                        console.log("The user dismissed the prompt without making a selection, " +
                            "or the user agent deems the selected content to be too sensitive or dangerous - " + e);
                        return null;
                    }
                }
            }
            Pickers.FolderPicker = FolderPicker;
        })(Pickers = Storage.Pickers || (Storage.Pickers = {}));
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        var Pickers;
        (function (Pickers) {
            class NativeFilePickerAcceptType {
            }
            Pickers.NativeFilePickerAcceptType = NativeFilePickerAcceptType;
        })(Pickers = Storage.Pickers || (Storage.Pickers = {}));
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        var Pickers;
        (function (Pickers) {
            class NativeFilePickerAcceptTypeItem {
            }
            Pickers.NativeFilePickerAcceptTypeItem = NativeFilePickerAcceptTypeItem;
        })(Pickers = Storage.Pickers || (Storage.Pickers = {}));
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        var Streams;
        (function (Streams) {
            class NativeFileReadStream {
                constructor(file) {
                    this._file = file;
                }
                static async openAsync(streamId, fileId) {
                    const file = await Storage.NativeStorageItem.getFile(fileId);
                    const fileSize = file.size;
                    const stream = new NativeFileReadStream(file);
                    NativeFileReadStream._streamMap.set(streamId, stream);
                    return fileSize.toString();
                }
                static async readAsync(streamId, targetArrayPointer, offset, count, position) {
                    var streamReader;
                    var readerNeedsRelease = true;
                    try {
                        const instance = NativeFileReadStream._streamMap.get(streamId);
                        var totalRead = 0;
                        var stream = await instance._file.slice(position, position + count).stream();
                        streamReader = stream.getReader();
                        var chunk = await streamReader.read();
                        while (!chunk.done && chunk.value) {
                            for (var i = 0; i < chunk.value.length; i++) {
                                Module.HEAPU8[targetArrayPointer + offset + totalRead + i] = chunk.value[i];
                            }
                            totalRead += chunk.value.length;
                            chunk = await streamReader.read();
                        }
                        // If this is the end of stream, it closed itself
                        readerNeedsRelease = !chunk.done;
                        return totalRead.toString();
                    }
                    finally {
                        // Reader must be released only if the underlying stream has not already closed it.				
                        // Otherwise the release operation sets a new Promise.reject as reader.closed which
                        // raises silent but observable exception in Chromium-based browsers.
                        if (streamReader && readerNeedsRelease) {
                            // Silently handling TypeError exceptions on closed event as the releaseLock()
                            // raises one in case of a successful close.
                            streamReader.closed.catch(reason => {
                                if (!(reason instanceof TypeError)) {
                                    throw reason;
                                }
                            });
                            streamReader.cancel();
                            streamReader.releaseLock();
                        }
                    }
                }
                static close(streamId) {
                    NativeFileReadStream._streamMap.delete(streamId);
                }
            }
            NativeFileReadStream._streamMap = new Map();
            Streams.NativeFileReadStream = NativeFileReadStream;
        })(Streams = Storage.Streams || (Storage.Streams = {}));
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var Uno;
(function (Uno) {
    var Storage;
    (function (Storage) {
        var Streams;
        (function (Streams) {
            class NativeFileWriteStream {
                constructor(stream) {
                    this._stream = stream;
                }
                static async openAsync(streamId, fileId) {
                    const item = Storage.NativeStorageItem.getItem(fileId);
                    if (item instanceof File) {
                        return "PermissionNotGranted";
                    }
                    const handle = item;
                    if (!await NativeFileWriteStream.verifyPermissionAsync(handle)) {
                        return "PermissionNotGranted";
                    }
                    const writableStream = await handle.createWritable({ keepExistingData: true });
                    const fileSize = (await handle.getFile()).size;
                    const stream = new NativeFileWriteStream(writableStream);
                    NativeFileWriteStream._streamMap.set(streamId, stream);
                    return fileSize.toString();
                }
                static async verifyPermissionAsync(fileHandle) {
                    const options = {};
                    options.mode = "readwrite";
                    // Check if permission was already granted. If so, return true.
                    if ((await fileHandle.queryPermission(options)) === 'granted') {
                        return true;
                    }
                    // Request permission. If the user grants permission, return true.
                    if ((await fileHandle.requestPermission(options)) === 'granted') {
                        return true;
                    }
                    // The user didn't grant permission, so return false.
                    return false;
                }
                static async writeAsync(streamId, dataArrayPointer, offset, count, position) {
                    const instance = NativeFileWriteStream._streamMap.get(streamId);
                    if (!instance._buffer || instance._buffer.length < count) {
                        instance._buffer = new Uint8Array(count);
                    }
                    var clampedArray = new Uint8Array(count);
                    for (var i = 0; i < count; i++) {
                        clampedArray[i] = Module.HEAPU8[dataArrayPointer + i + offset];
                    }
                    await instance._stream.write({
                        type: 'write',
                        data: clampedArray.subarray(0, count).buffer,
                        position: position
                    });
                    return "";
                }
                static async closeAsync(streamId) {
                    var instance = NativeFileWriteStream._streamMap.get(streamId);
                    if (instance) {
                        await instance._stream.close();
                        NativeFileWriteStream._streamMap.delete(streamId);
                    }
                    return "";
                }
                static async truncateAsync(streamId, length) {
                    var instance = NativeFileWriteStream._streamMap.get(streamId);
                    await instance._stream.truncate(length);
                    return "";
                }
            }
            NativeFileWriteStream._streamMap = new Map();
            Streams.NativeFileWriteStream = NativeFileWriteStream;
        })(Streams = Storage.Streams || (Storage.Streams = {}));
    })(Storage = Uno.Storage || (Uno.Storage = {}));
})(Uno || (Uno = {}));
var Windows;
(function (Windows) {
    var System;
    (function (System) {
        class MemoryManager {
            static getAppMemoryUsage() {
                if (typeof Module === "object") {
                    // Returns an approximate memory usage for the current wasm module.
                    // Initial buffer size is determine by the initial wasm memory defined in
                    // emscripten.
                    return Module.HEAPU8.length;
                }
                return 0;
            }
        }
        System.MemoryManager = MemoryManager;
    })(System = Windows.System || (Windows.System = {}));
})(Windows || (Windows = {}));
var WakeLockType;
(function (WakeLockType) {
    WakeLockType["screen"] = "screen";
})(WakeLockType || (WakeLockType = {}));
;
;
;
var Windows;
(function (Windows) {
    var System;
    (function (System) {
        var Display;
        (function (Display) {
            class DisplayRequest {
                static activateScreenLock() {
                    if (navigator.wakeLock) {
                        DisplayRequest.activeScreenLockPromise = navigator.wakeLock.request(WakeLockType.screen);
                        DisplayRequest.activeScreenLockPromise.catch(reason => console.log("Could not acquire screen lock (" + reason + ")"));
                    }
                    else {
                        console.log("Wake Lock API is not available in this browser.");
                    }
                }
                static deactivateScreenLock() {
                    if (DisplayRequest.activeScreenLockPromise) {
                        DisplayRequest.activeScreenLockPromise.then(sentinel => sentinel.release());
                        DisplayRequest.activeScreenLockPromise = null;
                    }
                }
            }
            Display.DisplayRequest = DisplayRequest;
        })(Display = System.Display || (System.Display = {}));
    })(System = Windows.System || (Windows.System = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var System;
    (function (System) {
        var Profile;
        (function (Profile) {
            class AnalyticsInfo {
                static getDeviceType() {
                    // Logic based on https://github.com/barisaydinoglu/Detectizr
                    var ua = navigator.userAgent;
                    if (!ua || ua === '') {
                        // No user agent.
                        return "unknown";
                    }
                    if (ua.match(/GoogleTV|SmartTV|SMART-TV|Internet TV|NetCast|NETTV|AppleTV|boxee|Kylo|Roku|DLNADOC|hbbtv|CrKey|CE\-HTML/i)) {
                        // if user agent is a smart TV - http://goo.gl/FocDk
                        return "Television";
                    }
                    else if (ua.match(/Xbox|PLAYSTATION|Wii/i)) {
                        // if user agent is a TV Based Gaming Console
                        return "GameConsole";
                    }
                    else if (ua.match(/QtCarBrowser/i)) {
                        // if the user agent is a car
                        return "Car";
                    }
                    else if (ua.match(/iP(a|ro)d/i) || (ua.match(/tablet/i) && !ua.match(/RX-34/i)) || ua.match(/FOLIO/i)) {
                        // if user agent is a Tablet
                        return "Tablet";
                    }
                    else if (ua.match(/Linux/i) && ua.match(/Android/i) && !ua.match(/Fennec|mobi|HTC Magic|HTCX06HT|Nexus One|SC-02B|fone 945/i)) {
                        // if user agent is an Android Tablet
                        return "Tablet";
                    }
                    else if (ua.match(/Kindle/i) || (ua.match(/Mac OS/i) && ua.match(/Silk/i)) || (ua.match(/AppleWebKit/i) && ua.match(/Silk/i) && !ua.match(/Playstation Vita/i))) {
                        // if user agent is a Kindle or Kindle Fire
                        return "Tablet";
                    }
                    else if (ua.match(/GT-P10|SC-01C|SHW-M180S|SGH-T849|SCH-I800|SHW-M180L|SPH-P100|SGH-I987|zt180|HTC( Flyer|_Flyer)|Sprint ATP51|ViewPad7|pandigital(sprnova|nova)|Ideos S7|Dell Streak 7|Advent Vega|A101IT|A70BHT|MID7015|Next2|nook/i) || (ua.match(/MB511/i) && ua.match(/RUTEM/i))) {
                        // if user agent is a pre Android 3.0 Tablet
                        return "Tablet";
                    }
                    else if (ua.match(/BOLT|Fennec|Iris|Maemo|Minimo|Mobi|mowser|NetFront|Novarra|Prism|RX-34|Skyfire|Tear|XV6875|XV6975|Google Wireless Transcoder/i) && !ua.match(/AdsBot-Google-Mobile/i)) {
                        // if user agent is unique phone User Agent
                        return "Mobile";
                    }
                    else if (ua.match(/Opera/i) && ua.match(/Windows NT 5/i) && ua.match(/HTC|Xda|Mini|Vario|SAMSUNG\-GT\-i8000|SAMSUNG\-SGH\-i9/i)) {
                        // if user agent is an odd Opera User Agent - http://goo.gl/nK90K
                        return "Mobile";
                    }
                    else if ((ua.match(/Windows( )?(NT|XP|ME|9)/) && !ua.match(/Phone/i)) && !ua.match(/Bot|Spider|ia_archiver|NewsGator/i) || ua.match(/Win( ?9|NT)/i) || ua.match(/Go-http-client/i)) {
                        // if user agent is Windows Desktop
                        return "Desktop";
                    }
                    else if (ua.match(/Macintosh|PowerPC/i) && !ua.match(/Silk|moatbot/i)) {
                        // if agent is Mac Desktop
                        return "Desktop";
                    }
                    else if (ua.match(/Linux/i) && ua.match(/X11/i) && !ua.match(/Charlotte|JobBot/i)) {
                        // if user agent is a Linux Desktop
                        return "Desktop";
                    }
                    else if (ua.match(/CrOS/)) {
                        // if user agent is a Chrome Book
                        return "Desktop";
                    }
                    else if (ua.match(/Solaris|SunOS|BSD/i)) {
                        // if user agent is a Solaris, SunOS, BSD Desktop
                        return "Desktop";
                    }
                    else {
                        // Otherwise returning the unknown type configured
                        return "Unknown";
                    }
                }
            }
            Profile.AnalyticsInfo = AnalyticsInfo;
        })(Profile = System.Profile || (System.Profile = {}));
    })(System = Windows.System || (Windows.System = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var System;
    (function (System) {
        var Profile;
        (function (Profile) {
            class AnalyticsVersionInfo {
                static getUserAgent() {
                    return navigator.userAgent;
                }
                static getBrowserName() {
                    // Opera 8.0+
                    if ((!!window.opr && !!window.opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
                        return "Opera";
                    }
                    // Firefox 1.0+
                    if (typeof window.InstallTrigger !== 'undefined') {
                        return "Firefox";
                    }
                    // Safari 3.0+ "[object HTMLElementConstructor]" 
                    if (/constructor/i.test(window.HTMLElement) ||
                        ((p) => p.toString() === "[object SafariRemoteNotification]")(typeof window.safari !== 'undefined' && window.safari.pushNotification)) {
                        return "Safari";
                    }
                    // Edge 20+
                    if (!!window.StyleMedia) {
                        return "Edge";
                    }
                    // Chrome 1 - 71
                    if (!!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)) {
                        return "Chrome";
                    }
                }
            }
            Profile.AnalyticsVersionInfo = AnalyticsVersionInfo;
        })(Profile = System.Profile || (System.Profile = {}));
    })(System = Windows.System || (Windows.System = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var UI;
    (function (UI) {
        var Core;
        (function (Core) {
            class SystemNavigationManager {
                constructor() {
                    var that = this;
                    var dispatchBackRequest = Module.mono_bind_static_method("[Uno] Windows.UI.Core.SystemNavigationManager:DispatchBackRequest");
                    window.history.replaceState(0, document.title, null);
                    window.addEventListener("popstate", function (evt) {
                        if (that._isEnabled) {
                            if (evt.state === 0) {
                                // Push something in the stack only if we know that we reached the first page.
                                // There is no way to track our location in the stack, so we use indexes (in the 'state').
                                window.history.pushState(1, document.title, null);
                            }
                            dispatchBackRequest();
                        }
                        else if (evt.state === 1) {
                            // The manager is disabled, but the user requested to navigate forward to our dummy entry,
                            // but we prefer to keep this dummy entry in the forward stack (is more prompt to be cleared by the browser,
                            // and as it's less commonly used it should be less annoying for the user)
                            window.history.back();
                        }
                    });
                }
                static get current() {
                    if (!this._current) {
                        this._current = new SystemNavigationManager();
                    }
                    return this._current;
                }
                enable() {
                    if (this._isEnabled) {
                        return;
                    }
                    // Clear the back stack, so the only items will be ours (and we won't have any remaining forward item)
                    this.clearStack();
                    window.history.pushState(1, document.title, null);
                    // Then set the enabled flag so the handler will begin its work
                    this._isEnabled = true;
                }
                disable() {
                    if (!this._isEnabled) {
                        return;
                    }
                    // Disable the handler, then clear the history
                    // Note: As a side effect, the forward button will be enabled :(
                    this._isEnabled = false;
                    this.clearStack();
                }
                clearStack() {
                    // There is no way to determine our position in the stack, so we only navigate back if we determine that
                    // we are currently on our dummy target page.
                    if (window.history.state === 1) {
                        window.history.back();
                    }
                    window.history.replaceState(0, document.title, null);
                }
            }
            Core.SystemNavigationManager = SystemNavigationManager;
        })(Core = UI.Core || (UI.Core = {}));
    })(UI = Windows.UI || (Windows.UI = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var UI;
    (function (UI) {
        var Notifications;
        (function (Notifications) {
            class BadgeUpdater {
                static setNumber(value) {
                    if (navigator.setAppBadge) {
                        navigator.setAppBadge(value);
                    }
                }
                static clear() {
                    if (navigator.clearAppBadge) {
                        navigator.clearAppBadge();
                    }
                }
            }
            Notifications.BadgeUpdater = BadgeUpdater;
        })(Notifications = UI.Notifications || (UI.Notifications = {}));
    })(UI = Windows.UI || (Windows.UI = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var UI;
    (function (UI) {
        var ViewManagement;
        (function (ViewManagement) {
            class ApplicationView {
                static setFullScreenMode(turnOn) {
                    if (turnOn) {
                        if (document.fullscreenEnabled) {
                            document.documentElement.requestFullscreen();
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                    else {
                        document.exitFullscreen();
                        return true;
                    }
                }
            }
            ViewManagement.ApplicationView = ApplicationView;
        })(ViewManagement = UI.ViewManagement || (UI.ViewManagement = {}));
    })(UI = Windows.UI || (Windows.UI = {}));
})(Windows || (Windows = {}));
var Windows;
(function (Windows) {
    var UI;
    (function (UI) {
        var ViewManagement;
        (function (ViewManagement) {
            class ApplicationViewTitleBar {
                static setBackgroundColor(colorString) {
                    if (colorString == null) {
                        //remove theme-color meta
                        var metaThemeColorEntries = document.querySelectorAll("meta[name='theme-color']");
                        for (let entry of metaThemeColorEntries) {
                            entry.remove();
                        }
                    }
                    else {
                        var metaThemeColorEntries = document.querySelectorAll("meta[name='theme-color']");
                        var metaThemeColor;
                        if (metaThemeColorEntries.length == 0) {
                            //create meta
                            metaThemeColor = document.createElement("meta");
                            metaThemeColor.setAttribute("name", "theme-color");
                            document.head.appendChild(metaThemeColor);
                        }
                        else {
                            metaThemeColor = metaThemeColorEntries[0];
                        }
                        metaThemeColor.setAttribute("content", colorString);
                    }
                }
            }
            ViewManagement.ApplicationViewTitleBar = ApplicationViewTitleBar;
        })(ViewManagement = UI.ViewManagement || (UI.ViewManagement = {}));
    })(UI = Windows.UI || (Windows.UI = {}));
})(Windows || (Windows = {}));
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            class Application {
                static getDefaultSystemTheme() {
                    if (window.matchMedia) {
                        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                            return Xaml.ApplicationTheme.Dark;
                        }
                        if (window.matchMedia("(prefers-color-scheme: light)").matches) {
                            return Xaml.ApplicationTheme.Light;
                        }
                    }
                    return null;
                }
                static observeSystemTheme() {
                    if (!Application.dispatchThemeChange) {
                        Application.dispatchThemeChange = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.Application:DispatchSystemThemeChange");
                    }
                    if (window.matchMedia) {
                        window.matchMedia('(prefers-color-scheme: dark)').addEventListener("change", () => {
                            Application.dispatchThemeChange();
                        });
                    }
                }
                static observeVisibility() {
                    if (!Application.dispatchVisibilityChange) {
                        Application.dispatchVisibilityChange = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.Application:DispatchVisibilityChange");
                    }
                    if (document.onvisibilitychange !== undefined) {
                        document.addEventListener("visibilitychange", () => {
                            Application.dispatchVisibilityChange(document.visibilityState == "visible");
                        });
                    }
                    if (window.onpagehide !== undefined) {
                        window.addEventListener("pagehide", () => {
                            Application.dispatchVisibilityChange(false);
                        });
                    }
                    if (window.onpageshow !== undefined) {
                        window.addEventListener("pageshow", () => {
                            Application.dispatchVisibilityChange(true);
                        });
                    }
                }
            }
            Xaml.Application = Application;
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            let ApplicationTheme;
            (function (ApplicationTheme) {
                ApplicationTheme["Light"] = "Light";
                ApplicationTheme["Dark"] = "Dark";
            })(ApplicationTheme = Xaml.ApplicationTheme || (Xaml.ApplicationTheme = {}));
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            var WindowManager = Uno.UI.WindowManager;
            var HtmlEventDispatchResult = Uno.UI.HtmlEventDispatchResult;
            var PointerDeviceType = Windows.Devices.Input.PointerDeviceType;
            let NativePointerEvent;
            (function (NativePointerEvent) {
                NativePointerEvent[NativePointerEvent["pointerover"] = 1] = "pointerover";
                NativePointerEvent[NativePointerEvent["pointerout"] = 2] = "pointerout";
                NativePointerEvent[NativePointerEvent["pointerdown"] = 4] = "pointerdown";
                NativePointerEvent[NativePointerEvent["pointerup"] = 8] = "pointerup";
                NativePointerEvent[NativePointerEvent["pointercancel"] = 16] = "pointercancel";
                // Optional pointer events
                NativePointerEvent[NativePointerEvent["pointermove"] = 32] = "pointermove";
                NativePointerEvent[NativePointerEvent["wheel"] = 64] = "wheel";
            })(NativePointerEvent = Xaml.NativePointerEvent || (Xaml.NativePointerEvent = {}));
            class UIElement_Pointers {
                static setPointerEventArgs(pArgs) {
                    if (!Xaml.UIElement._dispatchPointerEventMethod) {
                        Xaml.UIElement._dispatchPointerEventMethod = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.UIElement:OnNativePointerEvent");
                    }
                    Xaml.UIElement._dispatchPointerEventArgs = pArgs;
                }
                static setPointerEventResult(pArgs) {
                    if (!Xaml.UIElement._dispatchPointerEventMethod) {
                        Xaml.UIElement._dispatchPointerEventMethod = Module.mono_bind_static_method("[Uno.UI] Microsoft.UI.Xaml.UIElement:OnNativePointerEvent");
                    }
                    Xaml.UIElement._dispatchPointerEventResult = pArgs;
                }
                static subscribePointerEvents(pParams) {
                    const params = Microsoft.UI.Xaml.NativePointerSubscriptionParams.unmarshal(pParams);
                    const element = WindowManager.current.getView(params.HtmlId);
                    if (params.Events & NativePointerEvent.pointerover) {
                        element.addEventListener("pointerover", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointerout) {
                        element.addEventListener("pointerout", Xaml.UIElement.onPointerOutReceived);
                    }
                    if (params.Events & NativePointerEvent.pointerdown) {
                        element.addEventListener("pointerdown", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointerup) {
                        element.addEventListener("pointerup", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointercancel) {
                        element.addEventListener("pointercancel", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointermove) {
                        element.addEventListener("pointermove", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.wheel) {
                        element.addEventListener("wheel", Xaml.UIElement.onPointerEventReceived);
                    }
                }
                static unSubscribePointerEvents(pParams) {
                    const params = Microsoft.UI.Xaml.NativePointerSubscriptionParams.unmarshal(pParams);
                    const element = WindowManager.current.getView(params.HtmlId);
                    if (!element) {
                        return;
                    }
                    if (params.Events & NativePointerEvent.pointerover) {
                        element.removeEventListener("pointerover", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointerout) {
                        element.removeEventListener("pointerout", Xaml.UIElement.onPointerOutReceived);
                    }
                    if (params.Events & NativePointerEvent.pointerdown) {
                        element.removeEventListener("pointerdown", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointerup) {
                        element.removeEventListener("pointerup", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointercancel) {
                        element.removeEventListener("pointercancel", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.pointermove) {
                        element.removeEventListener("pointermove", Xaml.UIElement.onPointerEventReceived);
                    }
                    if (params.Events & NativePointerEvent.wheel) {
                        element.removeEventListener("wheel", Xaml.UIElement.onPointerEventReceived);
                    }
                }
                static onPointerEventReceived(evt) {
                    Xaml.UIElement.dispatchPointerEvent(evt.currentTarget, evt);
                }
                static onPointerOutReceived(evt) {
                    const element = evt.currentTarget;
                    if (evt.relatedTarget && evt.isDirectlyOver(element)) {
                        // The 'pointerout' event is bubbling so we get the event when the pointer is going out of a nested element,
                        // but pointer is still over the current element.
                        // So here we check if the event is effectively because the pointer is leaving the bounds of the current element.
                        // If not, we stopPropagation so parent won't have to check it again and again.
                        // Note: We don't have to do that for the "enter" as we anyway maintain the IsOver state in managed.
                        // Note: If relatedTarget is null it means that pointer is no longer on the app at all
                        //		 (alt + tab for mouse, finger removed from screen, pen out of detection range)
                        //		 If so, we have to forward the exit in all cases.
                        evt.stopPropagation();
                        return;
                    }
                    Xaml.UIElement.onPointerEventReceived(evt);
                }
                static dispatchPointerEvent(element, evt) {
                    if (!evt) {
                        return;
                    }
                    const args = Xaml.UIElement.toNativePointerEventArgs(evt);
                    args.HtmlId = Number(element.getAttribute("XamlHandle"));
                    args.marshal(Xaml.UIElement._dispatchPointerEventArgs);
                    Xaml.UIElement._dispatchPointerEventMethod();
                    const response = Microsoft.UI.Xaml.NativePointerEventResult.unmarshal(Xaml.UIElement._dispatchPointerEventResult);
                    if (response.Result & HtmlEventDispatchResult.StopPropagation) {
                        evt.stopPropagation();
                    }
                    if (response.Result & HtmlEventDispatchResult.PreventDefault) {
                        evt.preventDefault();
                    }
                }
                static get wheelLineSize() {
                    // In web browsers, scroll might happen by pixels, line or page.
                    // But WinUI works only with pixels, so we have to convert it before send the value to the managed code.
                    // The issue is that there is no easy way get the "size of a line", instead we have to determine the CSS "line-height"
                    // defined in the browser settings. 
                    // https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
                    if (this._wheelLineSize == undefined) {
                        const el = document.createElement("div");
                        el.style.fontSize = "initial";
                        el.style.display = "none";
                        document.body.appendChild(el);
                        const fontSize = window.getComputedStyle(el).fontSize;
                        document.body.removeChild(el);
                        this._wheelLineSize = fontSize ? parseInt(fontSize) : 16; /* 16 = The current common default font size */
                        // Based on observations, even if the event reports 3 lines (the settings of windows),
                        // the browser will actually scroll of about 6 lines of text.
                        this._wheelLineSize *= 2.0;
                    }
                    return this._wheelLineSize;
                }
                //#endregion
                //#region Helpers
                static toNativePointerEventArgs(evt) {
                    let src = evt.target;
                    if (src instanceof SVGElement) {
                        // The XAML SvgElement are UIElement in Uno (so they have a XamlHandle),
                        // but as on WinUI they are not part of the visual tree, they should not be used as OriginalElement.
                        // Instead we should use the actual parent <svg /> which is the XAML Shape.
                        const shape = src.ownerSVGElement;
                        if (shape) {
                            src = shape;
                        }
                    }
                    else if (src instanceof HTMLImageElement) {
                        // Same as above for images (<img /> == HtmlImage, we use the parent <div /> which is the XAML Image).
                        src = src.parentElement;
                    }
                    let srcHandle = "0";
                    while (src) {
                        const handle = src.getAttribute("XamlHandle");
                        if (handle) {
                            srcHandle = handle;
                            break;
                        }
                        src = src.parentElement;
                    }
                    let pointerId, pointerType, pressure;
                    let wheelDeltaX, wheelDeltaY;
                    if (evt instanceof WheelEvent) {
                        pointerId = evt.mozInputSource ? 0 : 1; // Try to match the mouse pointer ID 0 for FF, 1 for others
                        pointerType = PointerDeviceType.Mouse;
                        pressure = 0.5; // like WinUI
                        wheelDeltaX = evt.deltaX;
                        wheelDeltaY = evt.deltaY;
                        switch (evt.deltaMode) {
                            case WheelEvent.DOM_DELTA_LINE: // Actually this is supported only by FF
                                const lineSize = Xaml.UIElement.wheelLineSize;
                                wheelDeltaX *= lineSize;
                                wheelDeltaY *= lineSize;
                                break;
                            case WheelEvent.DOM_DELTA_PAGE:
                                wheelDeltaX *= document.documentElement.clientWidth;
                                wheelDeltaY *= document.documentElement.clientHeight;
                                break;
                        }
                    }
                    else {
                        pointerId = evt.pointerId;
                        pointerType = Xaml.UIElement.toPointerDeviceType(evt.pointerType);
                        pressure = evt.pressure;
                        wheelDeltaX = 0;
                        wheelDeltaY = 0;
                    }
                    const args = new Microsoft.UI.Xaml.NativePointerEventArgs();
                    args.Event = Xaml.UIElement.toNativeEvent(evt.type);
                    args.pointerId = pointerId;
                    args.x = evt.clientX;
                    args.y = evt.clientY;
                    args.ctrl = evt.ctrlKey;
                    args.shift = evt.shiftKey;
                    args.hasRelatedTarget = evt.relatedTarget !== null;
                    args.buttons = evt.buttons;
                    args.buttonUpdate = evt.button;
                    args.deviceType = pointerType;
                    args.srcHandle = Number(srcHandle);
                    args.timestamp = evt.timeStamp;
                    args.pressure = pressure;
                    args.wheelDeltaX = wheelDeltaX;
                    args.wheelDeltaY = wheelDeltaY;
                    return args;
                }
                static toNativeEvent(eventName) {
                    switch (eventName) {
                        case "pointerover":
                            return NativePointerEvent.pointerover;
                        case "pointerout":
                            return NativePointerEvent.pointerout;
                        case "pointerdown":
                            return NativePointerEvent.pointerdown;
                        case "pointerup":
                            return NativePointerEvent.pointerup;
                        case "pointercancel":
                            return NativePointerEvent.pointercancel;
                        case "pointermove":
                            return NativePointerEvent.pointermove;
                        case "wheel":
                            return NativePointerEvent.wheel;
                        default:
                            return undefined;
                    }
                }
                static toPointerDeviceType(type) {
                    switch (type) {
                        case "touch":
                            return PointerDeviceType.Touch;
                        case "pen":
                            // Note: As of 2019-11-28, once pen pressed events pressed/move/released are reported as TOUCH on Firefox
                            //		 https://bugzilla.mozilla.org/show_bug.cgi?id=1449660
                            return PointerDeviceType.Pen;
                        case "mouse":
                        default:
                            return PointerDeviceType.Mouse;
                    }
                }
            }
            //#region WheelLineSize
            UIElement_Pointers._wheelLineSize = undefined;
            Xaml.UIElement_Pointers = UIElement_Pointers;
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
/// <reference path="UIElement.Pointers.ts" />
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            class UIElement extends Microsoft.UI.Xaml.UIElement_Pointers {
            }
            Xaml.UIElement = UIElement;
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            var Media;
            (function (Media) {
                var Animation;
                (function (Animation) {
                    class RenderingLoopAnimator {
                        constructor(managedHandle) {
                            this.managedHandle = managedHandle;
                            this._isEnabled = false;
                        }
                        static createInstance(managedHandle, jsHandle) {
                            RenderingLoopAnimator.activeInstances[jsHandle] = new RenderingLoopAnimator(managedHandle);
                        }
                        static getInstance(jsHandle) {
                            return RenderingLoopAnimator.activeInstances[jsHandle];
                        }
                        static destroyInstance(jsHandle) {
                            var instance = RenderingLoopAnimator.getInstance(jsHandle);
                            // If the JSObjectHandle is being disposed before the animator is stopped (GC collecting JSObjectHandle before the animator)
                            // we won't be able to DisableFrameReporting anymore.
                            if (instance) {
                                instance.DisableFrameReporting();
                            }
                            delete RenderingLoopAnimator.activeInstances[jsHandle];
                        }
                        SetStartFrameDelay(delay) {
                            this.unscheduleFrame();
                            if (this._isEnabled) {
                                this.scheduleDelayedFrame(delay);
                            }
                        }
                        SetAnimationFramesInterval() {
                            this.unscheduleFrame();
                            if (this._isEnabled) {
                                this.onFrame();
                            }
                        }
                        EnableFrameReporting() {
                            if (this._isEnabled) {
                                return;
                            }
                            this._isEnabled = true;
                            this.scheduleAnimationFrame();
                        }
                        DisableFrameReporting() {
                            this._isEnabled = false;
                            this.unscheduleFrame();
                        }
                        onFrame() {
                            Uno.Foundation.Interop.ManagedObject.dispatch(this.managedHandle, "OnFrame", null);
                            // Schedule a new frame only if still enabled and no frame was scheduled by the managed OnFrame
                            if (this._isEnabled && this._frameRequestId == null && this._delayRequestId == null) {
                                this.scheduleAnimationFrame();
                            }
                        }
                        unscheduleFrame() {
                            if (this._delayRequestId != null) {
                                clearTimeout(this._delayRequestId);
                                this._delayRequestId = null;
                            }
                            if (this._frameRequestId != null) {
                                window.cancelAnimationFrame(this._frameRequestId);
                                this._frameRequestId = null;
                            }
                        }
                        scheduleDelayedFrame(delay) {
                            this._delayRequestId = setTimeout(() => {
                                this._delayRequestId = null;
                                this.onFrame();
                            }, delay);
                        }
                        scheduleAnimationFrame() {
                            this._frameRequestId = window.requestAnimationFrame(() => {
                                this._frameRequestId = null;
                                this.onFrame();
                            });
                        }
                    }
                    RenderingLoopAnimator.activeInstances = {};
                    Animation.RenderingLoopAnimator = RenderingLoopAnimator;
                })(Animation = Media.Animation || (Media.Animation = {}));
            })(Media = Xaml.Media || (Xaml.Media = {}));
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            var Input;
            (function (Input) {
                class FocusVisual {
                    static attachVisual(focusVisualId, focusedElementId) {
                        FocusVisual.focusVisualId = focusVisualId;
                        FocusVisual.focusVisual = Uno.UI.WindowManager.current.getView(focusVisualId);
                        FocusVisual.focusedElement = Uno.UI.WindowManager.current.getView(focusedElementId);
                        document.addEventListener("scroll", FocusVisual.onDocumentScroll, true);
                    }
                    static detachVisual() {
                        document.removeEventListener("scroll", FocusVisual.onDocumentScroll, true);
                        FocusVisual.focusVisualId = null;
                    }
                    static onDocumentScroll() {
                        if (!FocusVisual.dispatchPositionChange) {
                            FocusVisual.dispatchPositionChange = Module.mono_bind_static_method("[Uno.UI] Uno.UI.Xaml.Controls.SystemFocusVisual:DispatchNativePositionChange");
                        }
                        FocusVisual.updatePosition();
                        // Throttle managed notification while actively scrolling
                        if (FocusVisual.currentDispatchTimeout) {
                            clearTimeout(FocusVisual.currentDispatchTimeout);
                        }
                        FocusVisual.currentDispatchTimeout = setTimeout(() => FocusVisual.dispatchPositionChange(FocusVisual.focusVisualId), 100);
                    }
                    static updatePosition() {
                        const focusVisual = FocusVisual.focusVisual;
                        const focusedElement = FocusVisual.focusedElement;
                        const boundingRect = focusedElement.getBoundingClientRect();
                        const centerX = boundingRect.x + boundingRect.width / 2;
                        const centerY = boundingRect.y + boundingRect.height / 2;
                        focusVisual.style.setProperty("left", boundingRect.x + "px");
                        focusVisual.style.setProperty("top", boundingRect.y + "px");
                    }
                }
                Input.FocusVisual = FocusVisual;
            })(Input = Xaml.Input || (Xaml.Input = {}));
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            class NativePointerEventArgs {
                marshal(pData) {
                    Module.setValue(pData + 0, this.HtmlId, "*");
                    Module.setValue(pData + 4, this.Event, "i8");
                    Module.setValue(pData + 8, this.pointerId, "double");
                    Module.setValue(pData + 16, this.x, "double");
                    Module.setValue(pData + 24, this.y, "double");
                    Module.setValue(pData + 32, this.ctrl, "i32");
                    Module.setValue(pData + 36, this.shift, "i32");
                    Module.setValue(pData + 40, this.buttons, "i32");
                    Module.setValue(pData + 44, this.buttonUpdate, "i32");
                    Module.setValue(pData + 48, this.deviceType, "i32");
                    Module.setValue(pData + 52, this.srcHandle, "i32");
                    Module.setValue(pData + 56, this.timestamp, "double");
                    Module.setValue(pData + 64, this.pressure, "double");
                    Module.setValue(pData + 72, this.wheelDeltaX, "double");
                    Module.setValue(pData + 80, this.wheelDeltaY, "double");
                    Module.setValue(pData + 88, this.hasRelatedTarget, "i32");
                }
            }
            Xaml.NativePointerEventArgs = NativePointerEventArgs;
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            class NativePointerEventResult {
                static unmarshal(pData) {
                    const ret = new NativePointerEventResult();
                    {
                        ret.Result = Number(Module.getValue(pData + 0, "i8"));
                    }
                    return ret;
                }
            }
            Xaml.NativePointerEventResult = NativePointerEventResult;
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Microsoft;
(function (Microsoft) {
    var UI;
    (function (UI) {
        var Xaml;
        (function (Xaml) {
            class NativePointerSubscriptionParams {
                static unmarshal(pData) {
                    const ret = new NativePointerSubscriptionParams();
                    {
                        ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
                    }
                    {
                        ret.Events = Number(Module.getValue(pData + 4, "i8"));
                    }
                    return ret;
                }
            }
            Xaml.NativePointerSubscriptionParams = NativePointerSubscriptionParams;
        })(Xaml = UI.Xaml || (UI.Xaml = {}));
    })(UI = Microsoft.UI || (Microsoft.UI = {}));
})(Microsoft || (Microsoft = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerAddViewParams {
    static unmarshal(pData) {
        const ret = new WindowManagerAddViewParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.ChildView = Number(Module.getValue(pData + 4, "*"));
        }
        {
            ret.Index = Number(Module.getValue(pData + 8, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerArrangeElementParams {
    static unmarshal(pData) {
        const ret = new WindowManagerArrangeElementParams();
        {
            ret.Top = Number(Module.getValue(pData + 0, "double"));
        }
        {
            ret.Left = Number(Module.getValue(pData + 8, "double"));
        }
        {
            ret.Width = Number(Module.getValue(pData + 16, "double"));
        }
        {
            ret.Height = Number(Module.getValue(pData + 24, "double"));
        }
        {
            ret.ClipTop = Number(Module.getValue(pData + 32, "double"));
        }
        {
            ret.ClipLeft = Number(Module.getValue(pData + 40, "double"));
        }
        {
            ret.ClipBottom = Number(Module.getValue(pData + 48, "double"));
        }
        {
            ret.ClipRight = Number(Module.getValue(pData + 56, "double"));
        }
        {
            ret.HtmlId = Number(Module.getValue(pData + 64, "*"));
        }
        {
            ret.Clip = Boolean(Module.getValue(pData + 68, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerCreateContentParams {
    static unmarshal(pData) {
        const ret = new WindowManagerCreateContentParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.TagName = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.TagName = null;
            }
        }
        {
            ret.Handle = Number(Module.getValue(pData + 8, "*"));
        }
        {
            ret.UIElementRegistrationId = Number(Module.getValue(pData + 12, "i32"));
        }
        {
            ret.IsSvg = Boolean(Module.getValue(pData + 16, "i32"));
        }
        {
            ret.IsFocusable = Boolean(Module.getValue(pData + 20, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerDestroyViewParams {
    static unmarshal(pData) {
        const ret = new WindowManagerDestroyViewParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerGetBBoxParams {
    static unmarshal(pData) {
        const ret = new WindowManagerGetBBoxParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerGetBBoxReturn {
    marshal(pData) {
        Module.setValue(pData + 0, this.X, "double");
        Module.setValue(pData + 8, this.Y, "double");
        Module.setValue(pData + 16, this.Width, "double");
        Module.setValue(pData + 24, this.Height, "double");
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerGetClientViewSizeParams {
    static unmarshal(pData) {
        const ret = new WindowManagerGetClientViewSizeParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerGetClientViewSizeReturn {
    marshal(pData) {
        Module.setValue(pData + 0, this.OffsetWidth, "double");
        Module.setValue(pData + 8, this.OffsetHeight, "double");
        Module.setValue(pData + 16, this.ClientWidth, "double");
        Module.setValue(pData + 24, this.ClientHeight, "double");
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerInitParams {
    static unmarshal(pData) {
        const ret = new WindowManagerInitParams();
        {
            ret.IsHostedMode = Boolean(Module.getValue(pData + 0, "i32"));
        }
        {
            ret.IsLoadEventsEnabled = Boolean(Module.getValue(pData + 4, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerMeasureViewParams {
    static unmarshal(pData) {
        const ret = new WindowManagerMeasureViewParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.AvailableWidth = Number(Module.getValue(pData + 8, "double"));
        }
        {
            ret.AvailableHeight = Number(Module.getValue(pData + 16, "double"));
        }
        {
            ret.MeasureContent = Boolean(Module.getValue(pData + 24, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerMeasureViewReturn {
    marshal(pData) {
        Module.setValue(pData + 0, this.DesiredWidth, "double");
        Module.setValue(pData + 8, this.DesiredHeight, "double");
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerRegisterEventOnViewParams {
    static unmarshal(pData) {
        const ret = new WindowManagerRegisterEventOnViewParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.EventName = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.EventName = null;
            }
        }
        {
            ret.OnCapturePhase = Boolean(Module.getValue(pData + 8, "i32"));
        }
        {
            ret.EventExtractorId = Number(Module.getValue(pData + 12, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerRegisterPointerEventsOnViewParams {
    static unmarshal(pData) {
        const ret = new WindowManagerRegisterPointerEventsOnViewParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerRegisterUIElementParams {
    static unmarshal(pData) {
        const ret = new WindowManagerRegisterUIElementParams();
        {
            const ptr = Module.getValue(pData + 0, "*");
            if (ptr !== 0) {
                ret.TypeName = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.TypeName = null;
            }
        }
        {
            ret.IsFrameworkElement = Boolean(Module.getValue(pData + 4, "i32"));
        }
        {
            ret.Classes_Length = Number(Module.getValue(pData + 8, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 12, "*");
            if (pArray !== 0) {
                ret.Classes = new Array();
                for (var i = 0; i < ret.Classes_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.Classes.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.Classes.push(null);
                    }
                }
            }
            else {
                ret.Classes = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerRegisterUIElementReturn {
    marshal(pData) {
        Module.setValue(pData + 0, this.RegistrationId, "i32");
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerRemoveAttributeParams {
    static unmarshal(pData) {
        const ret = new WindowManagerRemoveAttributeParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.Name = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Name = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerRemoveViewParams {
    static unmarshal(pData) {
        const ret = new WindowManagerRemoveViewParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.ChildView = Number(Module.getValue(pData + 4, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerResetElementBackgroundParams {
    static unmarshal(pData) {
        const ret = new WindowManagerResetElementBackgroundParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerResetStyleParams {
    static unmarshal(pData) {
        const ret = new WindowManagerResetStyleParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Styles_Length = Number(Module.getValue(pData + 4, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 8, "*");
            if (pArray !== 0) {
                ret.Styles = new Array();
                for (var i = 0; i < ret.Styles_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.Styles.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.Styles.push(null);
                    }
                }
            }
            else {
                ret.Styles = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerScrollToOptionsParams {
    static unmarshal(pData) {
        const ret = new WindowManagerScrollToOptionsParams();
        {
            ret.Left = Number(Module.getValue(pData + 0, "double"));
        }
        {
            ret.Top = Number(Module.getValue(pData + 8, "double"));
        }
        {
            ret.HasLeft = Boolean(Module.getValue(pData + 16, "i32"));
        }
        {
            ret.HasTop = Boolean(Module.getValue(pData + 20, "i32"));
        }
        {
            ret.DisableAnimation = Boolean(Module.getValue(pData + 24, "i32"));
        }
        {
            ret.HtmlId = Number(Module.getValue(pData + 28, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetAttributeParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetAttributeParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.Name = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Name = null;
            }
        }
        {
            const ptr = Module.getValue(pData + 8, "*");
            if (ptr !== 0) {
                ret.Value = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Value = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetAttributesParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetAttributesParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Pairs_Length = Number(Module.getValue(pData + 4, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 8, "*");
            if (pArray !== 0) {
                ret.Pairs = new Array();
                for (var i = 0; i < ret.Pairs_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.Pairs.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.Pairs.push(null);
                    }
                }
            }
            else {
                ret.Pairs = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetClassesParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetClassesParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.CssClasses_Length = Number(Module.getValue(pData + 4, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 8, "*");
            if (pArray !== 0) {
                ret.CssClasses = new Array();
                for (var i = 0; i < ret.CssClasses_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.CssClasses.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.CssClasses.push(null);
                    }
                }
            }
            else {
                ret.CssClasses = null;
            }
        }
        {
            ret.Index = Number(Module.getValue(pData + 12, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetContentHtmlParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetContentHtmlParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.Html = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Html = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetElementBackgroundColorParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetElementBackgroundColorParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Color = Module.HEAPU32[(pData + 4) >> 2];
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetElementBackgroundGradientParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetElementBackgroundGradientParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.CssGradient = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.CssGradient = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetElementColorParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetElementColorParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Color = Module.HEAPU32[(pData + 4) >> 2];
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetElementFillParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetElementFillParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Color = Module.HEAPU32[(pData + 4) >> 2];
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetElementTransformParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetElementTransformParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.M11 = Number(Module.getValue(pData + 8, "double"));
        }
        {
            ret.M12 = Number(Module.getValue(pData + 16, "double"));
        }
        {
            ret.M21 = Number(Module.getValue(pData + 24, "double"));
        }
        {
            ret.M22 = Number(Module.getValue(pData + 32, "double"));
        }
        {
            ret.M31 = Number(Module.getValue(pData + 40, "double"));
        }
        {
            ret.M32 = Number(Module.getValue(pData + 48, "double"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetNameParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetNameParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.Name = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Name = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetPointerEventsParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetPointerEventsParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Enabled = Boolean(Module.getValue(pData + 4, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetPropertyParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetPropertyParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Pairs_Length = Number(Module.getValue(pData + 4, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 8, "*");
            if (pArray !== 0) {
                ret.Pairs = new Array();
                for (var i = 0; i < ret.Pairs_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.Pairs.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.Pairs.push(null);
                    }
                }
            }
            else {
                ret.Pairs = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetStyleDoubleParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetStyleDoubleParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.Name = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Name = null;
            }
        }
        {
            ret.Value = Number(Module.getValue(pData + 8, "double"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetStylesParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetStylesParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Pairs_Length = Number(Module.getValue(pData + 4, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 8, "*");
            if (pArray !== 0) {
                ret.Pairs = new Array();
                for (var i = 0; i < ret.Pairs_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.Pairs.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.Pairs.push(null);
                    }
                }
            }
            else {
                ret.Pairs = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetSvgElementRectParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetSvgElementRectParams();
        {
            ret.X = Number(Module.getValue(pData + 0, "double"));
        }
        {
            ret.Y = Number(Module.getValue(pData + 8, "double"));
        }
        {
            ret.Width = Number(Module.getValue(pData + 16, "double"));
        }
        {
            ret.Height = Number(Module.getValue(pData + 24, "double"));
        }
        {
            ret.HtmlId = Number(Module.getValue(pData + 32, "*"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetUnsetClassesParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetUnsetClassesParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.CssClassesToSet_Length = Number(Module.getValue(pData + 4, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 8, "*");
            if (pArray !== 0) {
                ret.CssClassesToSet = new Array();
                for (var i = 0; i < ret.CssClassesToSet_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.CssClassesToSet.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.CssClassesToSet.push(null);
                    }
                }
            }
            else {
                ret.CssClassesToSet = null;
            }
        }
        {
            ret.CssClassesToUnset_Length = Number(Module.getValue(pData + 12, "i32"));
        }
        {
            const pArray = Module.getValue(pData + 16, "*");
            if (pArray !== 0) {
                ret.CssClassesToUnset = new Array();
                for (var i = 0; i < ret.CssClassesToUnset_Length; i++) {
                    const value = Module.getValue(pArray + i * 4, "*");
                    if (value !== 0) {
                        ret.CssClassesToUnset.push(String(MonoRuntime.conv_string(value)));
                    }
                    else {
                        ret.CssClassesToUnset.push(null);
                    }
                }
            }
            else {
                ret.CssClassesToUnset = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetVisibilityParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetVisibilityParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            ret.Visible = Boolean(Module.getValue(pData + 4, "i32"));
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
class WindowManagerSetXUidParams {
    static unmarshal(pData) {
        const ret = new WindowManagerSetXUidParams();
        {
            ret.HtmlId = Number(Module.getValue(pData + 0, "*"));
        }
        {
            const ptr = Module.getValue(pData + 4, "*");
            if (ptr !== 0) {
                ret.Uid = String(Module.UTF8ToString(ptr));
            }
            else {
                ret.Uid = null;
            }
        }
        return ret;
    }
}
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var ApplicationModel;
    (function (ApplicationModel) {
        var DataTransfer;
        (function (DataTransfer) {
            var DragDrop;
            (function (DragDrop) {
                var Core;
                (function (Core) {
                    class DragDropExtensionEventArgs {
                        static unmarshal(pData) {
                            const ret = new DragDropExtensionEventArgs();
                            {
                                const ptr = Module.getValue(pData + 0, "*");
                                if (ptr !== 0) {
                                    ret.eventName = String(Module.UTF8ToString(ptr));
                                }
                                else {
                                    ret.eventName = null;
                                }
                            }
                            {
                                const ptr = Module.getValue(pData + 4, "*");
                                if (ptr !== 0) {
                                    ret.allowedOperations = String(Module.UTF8ToString(ptr));
                                }
                                else {
                                    ret.allowedOperations = null;
                                }
                            }
                            {
                                const ptr = Module.getValue(pData + 8, "*");
                                if (ptr !== 0) {
                                    ret.acceptedOperation = String(Module.UTF8ToString(ptr));
                                }
                                else {
                                    ret.acceptedOperation = null;
                                }
                            }
                            {
                                const ptr = Module.getValue(pData + 12, "*");
                                if (ptr !== 0) {
                                    ret.dataItems = String(Module.UTF8ToString(ptr));
                                }
                                else {
                                    ret.dataItems = null;
                                }
                            }
                            {
                                ret.timestamp = Number(Module.getValue(pData + 16, "double"));
                            }
                            {
                                ret.x = Number(Module.getValue(pData + 24, "double"));
                            }
                            {
                                ret.y = Number(Module.getValue(pData + 32, "double"));
                            }
                            {
                                ret.id = Number(Module.getValue(pData + 40, "i32"));
                            }
                            {
                                ret.buttons = Number(Module.getValue(pData + 44, "i32"));
                            }
                            {
                                ret.shift = Boolean(Module.getValue(pData + 48, "i32"));
                            }
                            {
                                ret.ctrl = Boolean(Module.getValue(pData + 52, "i32"));
                            }
                            {
                                ret.alt = Boolean(Module.getValue(pData + 56, "i32"));
                            }
                            return ret;
                        }
                        marshal(pData) {
                            {
                                const stringLength = lengthBytesUTF8(this.eventName);
                                const pString = Module._malloc(stringLength + 1);
                                stringToUTF8(this.eventName, pString, stringLength + 1);
                                Module.setValue(pData + 0, pString, "*");
                            }
                            {
                                const stringLength = lengthBytesUTF8(this.allowedOperations);
                                const pString = Module._malloc(stringLength + 1);
                                stringToUTF8(this.allowedOperations, pString, stringLength + 1);
                                Module.setValue(pData + 4, pString, "*");
                            }
                            {
                                const stringLength = lengthBytesUTF8(this.acceptedOperation);
                                const pString = Module._malloc(stringLength + 1);
                                stringToUTF8(this.acceptedOperation, pString, stringLength + 1);
                                Module.setValue(pData + 8, pString, "*");
                            }
                            {
                                const stringLength = lengthBytesUTF8(this.dataItems);
                                const pString = Module._malloc(stringLength + 1);
                                stringToUTF8(this.dataItems, pString, stringLength + 1);
                                Module.setValue(pData + 12, pString, "*");
                            }
                            Module.setValue(pData + 16, this.timestamp, "double");
                            Module.setValue(pData + 24, this.x, "double");
                            Module.setValue(pData + 32, this.y, "double");
                            Module.setValue(pData + 40, this.id, "i32");
                            Module.setValue(pData + 44, this.buttons, "i32");
                            Module.setValue(pData + 48, this.shift, "i32");
                            Module.setValue(pData + 52, this.ctrl, "i32");
                            Module.setValue(pData + 56, this.alt, "i32");
                        }
                    }
                    Core.DragDropExtensionEventArgs = DragDropExtensionEventArgs;
                })(Core = DragDrop.Core || (DragDrop.Core = {}));
            })(DragDrop = DataTransfer.DragDrop || (DataTransfer.DragDrop = {}));
        })(DataTransfer = ApplicationModel.DataTransfer || (ApplicationModel.DataTransfer = {}));
    })(ApplicationModel = Windows.ApplicationModel || (Windows.ApplicationModel = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_ClearParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_ClearParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_ClearParams = ApplicationDataContainer_ClearParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_ContainsKeyParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_ContainsKeyParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Key = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Key = null;
                    }
                }
                {
                    const ptr = Module.getValue(pData + 4, "*");
                    if (ptr !== 0) {
                        ret.Value = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Value = null;
                    }
                }
                {
                    const ptr = Module.getValue(pData + 8, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_ContainsKeyParams = ApplicationDataContainer_ContainsKeyParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_ContainsKeyReturn {
            marshal(pData) {
                Module.setValue(pData + 0, this.ContainsKey, "i32");
            }
        }
        Storage.ApplicationDataContainer_ContainsKeyReturn = ApplicationDataContainer_ContainsKeyReturn;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_GetCountParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_GetCountParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_GetCountParams = ApplicationDataContainer_GetCountParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_GetCountReturn {
            marshal(pData) {
                Module.setValue(pData + 0, this.Count, "i32");
            }
        }
        Storage.ApplicationDataContainer_GetCountReturn = ApplicationDataContainer_GetCountReturn;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_GetKeyByIndexParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_GetKeyByIndexParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                {
                    ret.Index = Number(Module.getValue(pData + 4, "i32"));
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_GetKeyByIndexParams = ApplicationDataContainer_GetKeyByIndexParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_GetKeyByIndexReturn {
            marshal(pData) {
                {
                    const stringLength = lengthBytesUTF8(this.Value);
                    const pString = Module._malloc(stringLength + 1);
                    stringToUTF8(this.Value, pString, stringLength + 1);
                    Module.setValue(pData + 0, pString, "*");
                }
            }
        }
        Storage.ApplicationDataContainer_GetKeyByIndexReturn = ApplicationDataContainer_GetKeyByIndexReturn;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_GetValueByIndexParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_GetValueByIndexParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                {
                    ret.Index = Number(Module.getValue(pData + 4, "i32"));
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_GetValueByIndexParams = ApplicationDataContainer_GetValueByIndexParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_GetValueByIndexReturn {
            marshal(pData) {
                {
                    const stringLength = lengthBytesUTF8(this.Value);
                    const pString = Module._malloc(stringLength + 1);
                    stringToUTF8(this.Value, pString, stringLength + 1);
                    Module.setValue(pData + 0, pString, "*");
                }
            }
        }
        Storage.ApplicationDataContainer_GetValueByIndexReturn = ApplicationDataContainer_GetValueByIndexReturn;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_RemoveParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_RemoveParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                {
                    const ptr = Module.getValue(pData + 4, "*");
                    if (ptr !== 0) {
                        ret.Key = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Key = null;
                    }
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_RemoveParams = ApplicationDataContainer_RemoveParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_RemoveReturn {
            marshal(pData) {
                Module.setValue(pData + 0, this.Removed, "i32");
            }
        }
        Storage.ApplicationDataContainer_RemoveReturn = ApplicationDataContainer_RemoveReturn;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_SetValueParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_SetValueParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Key = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Key = null;
                    }
                }
                {
                    const ptr = Module.getValue(pData + 4, "*");
                    if (ptr !== 0) {
                        ret.Value = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Value = null;
                    }
                }
                {
                    const ptr = Module.getValue(pData + 8, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_SetValueParams = ApplicationDataContainer_SetValueParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_TryGetValueParams {
            static unmarshal(pData) {
                const ret = new ApplicationDataContainer_TryGetValueParams();
                {
                    const ptr = Module.getValue(pData + 0, "*");
                    if (ptr !== 0) {
                        ret.Key = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Key = null;
                    }
                }
                {
                    const ptr = Module.getValue(pData + 4, "*");
                    if (ptr !== 0) {
                        ret.Locality = String(Module.UTF8ToString(ptr));
                    }
                    else {
                        ret.Locality = null;
                    }
                }
                return ret;
            }
        }
        Storage.ApplicationDataContainer_TryGetValueParams = ApplicationDataContainer_TryGetValueParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class ApplicationDataContainer_TryGetValueReturn {
            marshal(pData) {
                {
                    const stringLength = lengthBytesUTF8(this.Value);
                    const pString = Module._malloc(stringLength + 1);
                    stringToUTF8(this.Value, pString, stringLength + 1);
                    Module.setValue(pData + 0, pString, "*");
                }
                Module.setValue(pData + 4, this.HasValue, "i32");
            }
        }
        Storage.ApplicationDataContainer_TryGetValueReturn = ApplicationDataContainer_TryGetValueReturn;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
/* TSBindingsGenerator Generated code -- this code is regenerated on each build */
var Windows;
(function (Windows) {
    var Storage;
    (function (Storage) {
        class StorageFolderMakePersistentParams {
            static unmarshal(pData) {
                const ret = new StorageFolderMakePersistentParams();
                {
                    ret.Paths_Length = Number(Module.getValue(pData + 0, "i32"));
                }
                {
                    const pArray = Module.getValue(pData + 4, "*");
                    if (pArray !== 0) {
                        ret.Paths = new Array();
                        for (var i = 0; i < ret.Paths_Length; i++) {
                            const value = Module.getValue(pArray + i * 4, "*");
                            if (value !== 0) {
                                ret.Paths.push(String(MonoRuntime.conv_string(value)));
                            }
                            else {
                                ret.Paths.push(null);
                            }
                        }
                    }
                    else {
                        ret.Paths = null;
                    }
                }
                return ret;
            }
        }
        Storage.StorageFolderMakePersistentParams = StorageFolderMakePersistentParams;
    })(Storage = Windows.Storage || (Windows.Storage = {}));
})(Windows || (Windows = {}));
