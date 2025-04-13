/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/gmail/scan/route";
exports.ids = ["app/api/gmail/scan/route"];
exports.modules = {

/***/ "(rsc)/./app/api/gmail/scan/route.ts":
/*!*************************************!*\
  !*** ./app/api/gmail/scan/route.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var googleapis__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! googleapis */ \"(rsc)/./node_modules/googleapis/build/src/index.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/jwt */ \"(rsc)/./node_modules/next-auth/jwt/index.js\");\n/* harmony import */ var next_auth_jwt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__);\n\n\n\nasync function GET(req) {\n    const token = await (0,next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__.getToken)({\n        req\n    });\n    if (!token?.accessToken) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Not authenticated\"\n        }, {\n            status: 401\n        });\n    }\n    // Initialize Google OAuth2 client\n    const oauth2Client = new googleapis__WEBPACK_IMPORTED_MODULE_2__.google.auth.OAuth2();\n    oauth2Client.setCredentials({\n        access_token: token.accessToken\n    });\n    const gmail = googleapis__WEBPACK_IMPORTED_MODULE_2__.google.gmail({\n        version: \"v1\",\n        auth: oauth2Client\n    });\n    const res = await gmail.users.messages.list({\n        userId: \"me\",\n        q: 'newer_than:60d subject:(receipt OR subscription OR payment)',\n        maxResults: 10\n    });\n    const messages = res.data.messages || [];\n    const subscriptions = [];\n    function detectVendor(subject, from) {\n        const patterns = [\n            {\n                name: \"Apple\",\n                test: from.includes(\"apple.com\") || subject.toLowerCase().includes(\"apple\")\n            },\n            {\n                name: \"LinkedIn\",\n                test: from.includes(\"linkedin.com\")\n            },\n            {\n                name: \"WSJ\",\n                test: from.includes(\"dowjones.com\") || subject.includes(\"WSJ+\")\n            },\n            {\n                name: \"Rogers\",\n                test: from.includes(\"rogers.com\")\n            },\n            {\n                name: \"Affirm\",\n                test: from.includes(\"affirm.ca\")\n            },\n            {\n                name: \"Eventbrite\",\n                test: from.includes(\"eventbrite.com\")\n            },\n            {\n                name: \"H&R Block\",\n                test: from.includes(\"bambora.com\")\n            }\n        ];\n        const matched = patterns.find((p)=>p.test);\n        return matched?.name ?? null;\n    }\n    for (const msg of messages){\n        const msgData = await gmail.users.messages.get({\n            userId: \"me\",\n            id: msg.id,\n            format: \"metadata\",\n            metadataHeaders: [\n                \"From\",\n                \"Subject\",\n                \"Date\"\n            ]\n        });\n        const headers = msgData.data.payload?.headers || [];\n        const subject = headers.find((h)=>h.name === \"Subject\")?.value || \"\";\n        const from = headers.find((h)=>h.name === \"From\")?.value || \"\";\n        const date = headers.find((h)=>h.name === \"Date\")?.value || \"\";\n        const service = detectVendor(subject, from);\n        if (service) {\n            subscriptions.push({\n                service,\n                subject,\n                from,\n                date\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            subscriptions\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TSxJQUFJLENBQUM7WUFBRWtCO1FBQWM7SUFFM0M7QUFDQSIsInNvdXJjZXMiOlsiL1VzZXJzL2toaXphcm1hbGlrL3JlcG9zL2VtYWlsLXN1YnMvYXBwL2FwaS9nbWFpbC9zY2FuL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdvb2dsZSB9IGZyb20gXCJnb29nbGVhcGlzXCJcbmltcG9ydCB7IE5leHRSZXNwb25zZSwgTmV4dFJlcXVlc3QgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIlxuaW1wb3J0IHsgZ2V0VG9rZW4gfSBmcm9tIFwibmV4dC1hdXRoL2p3dFwiXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxOiBOZXh0UmVxdWVzdCkge1xuICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKHsgcmVxIH0pXG5cbiAgaWYgKCF0b2tlbj8uYWNjZXNzVG9rZW4pIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJOb3QgYXV0aGVudGljYXRlZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSlcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgR29vZ2xlIE9BdXRoMiBjbGllbnRcbiAgY29uc3Qgb2F1dGgyQ2xpZW50ID0gbmV3IGdvb2dsZS5hdXRoLk9BdXRoMigpXG4gIG9hdXRoMkNsaWVudC5zZXRDcmVkZW50aWFscyh7XG4gICAgYWNjZXNzX3Rva2VuOiB0b2tlbi5hY2Nlc3NUb2tlbixcbiAgfSlcblxuICBjb25zdCBnbWFpbCA9IGdvb2dsZS5nbWFpbCh7XG4gICAgdmVyc2lvbjogXCJ2MVwiLFxuICAgIGF1dGg6IG9hdXRoMkNsaWVudCwgLy8g4pyFIFRoaXMgaXMgd2hhdCBHb29nbGUgZXhwZWN0c1xuICB9KVxuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGdtYWlsLnVzZXJzLm1lc3NhZ2VzLmxpc3Qoe1xuICAgIHVzZXJJZDogXCJtZVwiLFxuICAgIHE6ICduZXdlcl90aGFuOjYwZCBzdWJqZWN0OihyZWNlaXB0IE9SIHN1YnNjcmlwdGlvbiBPUiBwYXltZW50KScsXG4gICAgbWF4UmVzdWx0czogMTAsXG4gIH0pXG5cbiAgY29uc3QgbWVzc2FnZXMgPSByZXMuZGF0YS5tZXNzYWdlcyB8fCBbXVxuICBjb25zdCBzdWJzY3JpcHRpb25zID0gW11cbiAgXG4gIGZ1bmN0aW9uIGRldGVjdFZlbmRvcihzdWJqZWN0OiBzdHJpbmcsIGZyb206IHN0cmluZykge1xuICAgIGNvbnN0IHBhdHRlcm5zID0gW1xuICAgICAgeyBuYW1lOiBcIkFwcGxlXCIsIHRlc3Q6IGZyb20uaW5jbHVkZXMoXCJhcHBsZS5jb21cIikgfHwgc3ViamVjdC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYXBwbGVcIikgfSxcbiAgICAgIHsgbmFtZTogXCJMaW5rZWRJblwiLCB0ZXN0OiBmcm9tLmluY2x1ZGVzKFwibGlua2VkaW4uY29tXCIpIH0sXG4gICAgICB7IG5hbWU6IFwiV1NKXCIsIHRlc3Q6IGZyb20uaW5jbHVkZXMoXCJkb3dqb25lcy5jb21cIikgfHwgc3ViamVjdC5pbmNsdWRlcyhcIldTSitcIikgfSxcbiAgICAgIHsgbmFtZTogXCJSb2dlcnNcIiwgdGVzdDogZnJvbS5pbmNsdWRlcyhcInJvZ2Vycy5jb21cIikgfSxcbiAgICAgIHsgbmFtZTogXCJBZmZpcm1cIiwgdGVzdDogZnJvbS5pbmNsdWRlcyhcImFmZmlybS5jYVwiKSB9LFxuICAgICAgeyBuYW1lOiBcIkV2ZW50YnJpdGVcIiwgdGVzdDogZnJvbS5pbmNsdWRlcyhcImV2ZW50YnJpdGUuY29tXCIpIH0sXG4gICAgICB7IG5hbWU6IFwiSCZSIEJsb2NrXCIsIHRlc3Q6IGZyb20uaW5jbHVkZXMoXCJiYW1ib3JhLmNvbVwiKSB9LFxuICAgIF1cbiAgXG4gICAgY29uc3QgbWF0Y2hlZCA9IHBhdHRlcm5zLmZpbmQocCA9PiBwLnRlc3QpXG4gICAgcmV0dXJuIG1hdGNoZWQ/Lm5hbWUgPz8gbnVsbFxuICB9XG4gIFxuICBmb3IgKGNvbnN0IG1zZyBvZiBtZXNzYWdlcykge1xuICAgIGNvbnN0IG1zZ0RhdGEgPSBhd2FpdCBnbWFpbC51c2Vycy5tZXNzYWdlcy5nZXQoe1xuICAgICAgdXNlcklkOiBcIm1lXCIsXG4gICAgICBpZDogbXNnLmlkISxcbiAgICAgIGZvcm1hdDogXCJtZXRhZGF0YVwiLFxuICAgICAgbWV0YWRhdGFIZWFkZXJzOiBbXCJGcm9tXCIsIFwiU3ViamVjdFwiLCBcIkRhdGVcIl0sXG4gICAgfSlcbiAgXG4gICAgY29uc3QgaGVhZGVycyA9IG1zZ0RhdGEuZGF0YS5wYXlsb2FkPy5oZWFkZXJzIHx8IFtdXG4gICAgY29uc3Qgc3ViamVjdCA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gXCJTdWJqZWN0XCIpPy52YWx1ZSB8fCBcIlwiXG4gICAgY29uc3QgZnJvbSA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gXCJGcm9tXCIpPy52YWx1ZSB8fCBcIlwiXG4gICAgY29uc3QgZGF0ZSA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gXCJEYXRlXCIpPy52YWx1ZSB8fCBcIlwiXG4gIFxuICAgIGNvbnN0IHNlcnZpY2UgPSBkZXRlY3RWZW5kb3Ioc3ViamVjdCwgZnJvbSlcbiAgXG4gICAgaWYgKHNlcnZpY2UpIHtcbiAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCh7IHNlcnZpY2UsIHN1YmplY3QsIGZyb20sIGRhdGUgfSlcbiAgICB9XG5cbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgc3Vic2NyaXB0aW9ucyB9KVxuXG59XG59XG4iXSwibmFtZXMiOlsiZ29vZ2xlIiwiTmV4dFJlc3BvbnNlIiwiZ2V0VG9rZW4iLCJHRVQiLCJyZXEiLCJ0b2tlbiIsImFjY2Vzc1Rva2VuIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwib2F1dGgyQ2xpZW50IiwiYXV0aCIsIk9BdXRoMiIsInNldENyZWRlbnRpYWxzIiwiYWNjZXNzX3Rva2VuIiwiZ21haWwiLCJ2ZXJzaW9uIiwicmVzIiwidXNlcnMiLCJtZXNzYWdlcyIsImxpc3QiLCJ1c2VySWQiLCJxIiwibWF4UmVzdWx0cyIsImRhdGEiLCJzdWJzY3JpcHRpb25zIiwiZGV0ZWN0VmVuZG9yIiwic3ViamVjdCIsImZyb20iLCJwYXR0ZXJucyIsIm5hbWUiLCJ0ZXN0IiwiaW5jbHVkZXMiLCJ0b0xvd2VyQ2FzZSIsIm1hdGNoZWQiLCJmaW5kIiwicCIsIm1zZyIsIm1zZ0RhdGEiLCJnZXQiLCJpZCIsImZvcm1hdCIsIm1ldGFkYXRhSGVhZGVycyIsImhlYWRlcnMiLCJwYXlsb2FkIiwiaCIsInZhbHVlIiwiZGF0ZSIsInNlcnZpY2UiLCJwdXNoIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/gmail/scan/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_khizarmalik_repos_email_subs_app_api_gmail_scan_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/gmail/scan/route.ts */ \"(rsc)/./app/api/gmail/scan/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/gmail/scan/route\",\n        pathname: \"/api/gmail/scan\",\n        filename: \"route\",\n        bundlePath: \"app/api/gmail/scan/route\"\n    },\n    resolvedPagePath: \"/Users/khizarmalik/repos/email-subs/app/api/gmail/scan/route.ts\",\n    nextConfigOutput,\n    userland: _Users_khizarmalik_repos_email_subs_app_api_gmail_scan_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZnbWFpbCUyRnNjYW4lMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmdtYWlsJTJGc2NhbiUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmdtYWlsJTJGc2NhbiUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmtoaXphcm1hbGlrJTJGcmVwb3MlMkZlbWFpbC1zdWJzJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRmtoaXphcm1hbGlrJTJGcmVwb3MlMkZlbWFpbC1zdWJzJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNlO0FBQzVGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMva2hpemFybWFsaWsvcmVwb3MvZW1haWwtc3Vicy9hcHAvYXBpL2dtYWlsL3NjYW4vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2dtYWlsL3NjYW4vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9nbWFpbC9zY2FuXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9nbWFpbC9zY2FuL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2toaXphcm1hbGlrL3JlcG9zL2VtYWlsLXN1YnMvYXBwL2FwaS9nbWFpbC9zY2FuL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?d272":
/*!********************************!*\
  !*** supports-color (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "http2":
/*!************************!*\
  !*** external "http2" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("http2");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:events":
/*!******************************!*\
  !*** external "node:events" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:events");

/***/ }),

/***/ "node:process":
/*!*******************************!*\
  !*** external "node:process" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:process");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/uuid","vendor-chunks/@panva","vendor-chunks/googleapis","vendor-chunks/google-auth-library","vendor-chunks/googleapis-common","vendor-chunks/gaxios","vendor-chunks/math-intrinsics","vendor-chunks/es-errors","vendor-chunks/whatwg-url","vendor-chunks/qs","vendor-chunks/jws","vendor-chunks/call-bind-apply-helpers","vendor-chunks/debug","vendor-chunks/json-bigint","vendor-chunks/google-logging-utils","vendor-chunks/get-proto","vendor-chunks/tr46","vendor-chunks/object-inspect","vendor-chunks/https-proxy-agent","vendor-chunks/has-symbols","vendor-chunks/gopd","vendor-chunks/gcp-metadata","vendor-chunks/function-bind","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/agent-base","vendor-chunks/node-fetch","vendor-chunks/webidl-conversions","vendor-chunks/url-template","vendor-chunks/side-channel","vendor-chunks/side-channel-weakmap","vendor-chunks/side-channel-map","vendor-chunks/side-channel-list","vendor-chunks/safe-buffer","vendor-chunks/ms","vendor-chunks/jwa","vendor-chunks/is-stream","vendor-chunks/hasown","vendor-chunks/gtoken","vendor-chunks/get-intrinsic","vendor-chunks/extend","vendor-chunks/es-object-atoms","vendor-chunks/es-define-property","vendor-chunks/dunder-proto","vendor-chunks/call-bound","vendor-chunks/buffer-equal-constant-time","vendor-chunks/bignumber.js","vendor-chunks/base64-js"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();