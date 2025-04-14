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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var googleapis__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! googleapis */ \"(rsc)/./node_modules/googleapis/build/src/index.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/jwt */ \"(rsc)/./node_modules/next-auth/jwt/index.js\");\n/* harmony import */ var next_auth_jwt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var jsdom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jsdom */ \"jsdom\");\n/* harmony import */ var jsdom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(jsdom__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_openaiClient__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/openaiClient */ \"(rsc)/./lib/openaiClient.ts\");\n/* harmony import */ var _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/lib/supabaseClient */ \"(rsc)/./lib/supabaseClient.ts\");\n\n\n\n\n\n\nasync function GET(req) {\n    const token = await (0,next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__.getToken)({\n        req\n    });\n    if (!token?.accessToken || !token.sub) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Not authenticated\"\n        }, {\n            status: 401\n        });\n    }\n    const { data: userRecord, error: userErr } = await _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_4__.supabase.from(\"users\").select(\"id\").eq(\"auth_provider_id\", token.sub).maybeSingle();\n    if (userErr || !userRecord) {\n        console.error(\"❌ Could not find user with auth_provider_id\", token.sub);\n        return;\n    }\n    const userId = userRecord.id;\n    const oauth2Client = new googleapis__WEBPACK_IMPORTED_MODULE_5__.google.auth.OAuth2();\n    oauth2Client.setCredentials({\n        access_token: token.accessToken,\n        refresh_token: token.refreshToken\n    });\n    const gmail = googleapis__WEBPACK_IMPORTED_MODULE_5__.google.gmail({\n        version: \"v1\",\n        auth: oauth2Client\n    });\n    const res = await gmail.users.messages.list({\n        userId: \"me\",\n        q: 'newer_than:60d subject:(receipt OR subscription OR payment)',\n        maxResults: 50\n    });\n    const messages = res.data.messages || [];\n    const results = [];\n    function extractBodyText(payload) {\n        function findPart(part) {\n            if (part.mimeType === \"text/html\") {\n                const data = part.body?.data;\n                if (data) {\n                    const decoded = Buffer.from(data, \"base64\").toString(\"utf8\");\n                    const dom = new jsdom__WEBPACK_IMPORTED_MODULE_2__.JSDOM(decoded);\n                    const textContent = dom.window.document.body.textContent || \"\";\n                    // ⬇️ Grab all table content as raw strings to avoid flattening losses\n                    const tdValues = Array.from(dom.window.document.querySelectorAll(\"td, th, p\")).map((el)=>el.textContent?.trim()).filter(Boolean).join(\" | \");\n                    return `${textContent}\\n\\nExtra: ${tdValues}`;\n                }\n            }\n            if (part.mimeType === \"text/plain\") {\n                const data = part.body?.data;\n                return data ? Buffer.from(data, \"base64\").toString(\"utf8\") : \"\";\n            }\n            if (Array.isArray(part.parts)) {\n                for (const child of part.parts){\n                    const found = findPart(child);\n                    if (found) return found;\n                }\n            }\n            return null;\n        }\n        return findPart(payload) || \"\";\n    }\n    for (const msg of messages){\n        try {\n            const msgData = await gmail.users.messages.get({\n                userId: \"me\",\n                id: msg.id,\n                format: \"full\"\n            });\n            const headers = msgData.data.payload?.headers || [];\n            const subject = headers.find((h)=>h.name === \"Subject\")?.value || \"\";\n            const from = headers.find((h)=>h.name === \"From\")?.value || \"\";\n            const date = headers.find((h)=>h.name === \"Date\")?.value || \"\";\n            const bodyText = extractBodyText(msgData.data.payload);\n            const currencyMatch = bodyText.match(/(?:\\$|USD|CAD|dollars?)\\s*([0-9]+(?:\\.[0-9]{2})?)/i);\n            const isReceipt = subject.toLowerCase().includes(\"receipt\");\n            if (!isReceipt && !currencyMatch) {\n                console.log(\"🛑 Skipping due to no currency match:\", subject);\n                continue;\n            }\n            // 🧠 Basic spam/scam detection: ignore emails with \"check\" or \"deposit\" and no vendor domain\n            const lowerBody = bodyText.toLowerCase();\n            if (lowerBody.includes(\"check\") && lowerBody.includes(\"deposit\")) {\n                console.log(\"⚠️ Skipping email likely about a check, not a charge:\", subject);\n                continue;\n            }\n            const prompt = `\n        You are a billing email parser. Your job is to extract billing details **only if the user is being charged or billed**.\n\n        You MUST NOT extract data if the email is:\n        - about a check being sent TO the user\n        - a refund or reimbursement\n        - just a notification or marketing email\n        - a receipt without an amount charged\n\n        Only extract the data if the amount is associated with a currency (like $ or USD or CAD or dollars).\n\n        Your response must be a strict JSON object like this:\n        {\n        \"vendor_name\": string | null,\n        \"amount\": number | null,\n        \"currency\": string | null,\n        \"billing_interval\": \"monthly\" | \"yearly\" | \"weekly\" | \"one-time\" | null,\n        \"is_subscription\": boolean\n        }\n\n        Given the following email metadata and body, extract structured data **only if there was a real payment charged to the user**:\n\n        Subject: \"${subject}\"\n        From: \"${from}\"\n        Body:\n        \"\"\"\n        ${bodyText.slice(0, 3000)}\n        \"\"\"\n      `;\n            const completion = await _lib_openaiClient__WEBPACK_IMPORTED_MODULE_3__.openai.chat.completions.create({\n                model: \"gpt-3.5-turbo\",\n                messages: [\n                    {\n                        role: \"system\",\n                        content: \"You are a billing email parser.\"\n                    },\n                    {\n                        role: \"user\",\n                        content: prompt\n                    }\n                ],\n                temperature: 0.2\n            });\n            const jsonStr = completion.choices[0].message.content || \"{}\";\n            const clean = jsonStr.replace(/```json|```/g, \"\").trim();\n            const parsed = JSON.parse(clean);\n            let fallbackAmount = parsed.amount;\n            let fallbackCurrency = parsed.currency;\n            if (fallbackAmount == null || fallbackCurrency == null) {\n                const match = bodyText.match(/(?:\\$|USD|CAD|dollars?)\\s*([0-9]+(?:\\.[0-9]{2})?)/i);\n                if (match) {\n                    fallbackAmount = parseFloat(match[1]);\n                    fallbackCurrency = match[0].includes(\"USD\") ? \"USD\" : match[0].includes(\"CAD\") ? \"CAD\" : \"$\";\n                }\n            }\n            const finalAmount = fallbackAmount ?? null;\n            const finalCurrency = fallbackCurrency ?? null;\n            // 👀 Only save if both amount and currency are valid\n            if (finalAmount !== null && finalCurrency !== null) {\n                results.push({\n                    subject,\n                    from,\n                    date,\n                    vendor_name: parsed.vendor_name,\n                    amount: finalAmount,\n                    currency: finalCurrency,\n                    billing_interval: parsed.billing_interval,\n                    is_subscription: parsed.is_subscription\n                });\n                const { error: insertError } = await _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_4__.supabase.from(\"subscriptions\").insert({\n                    user_id: userId,\n                    service_name: parsed.vendor_name || \"Unknown\",\n                    amount: finalAmount,\n                    currency: finalCurrency,\n                    billing_interval: parsed.billing_interval || \"one-time\",\n                    last_seen_email_id: msg.id\n                });\n                if (insertError) {\n                    console.error(\"❌ Supabase insert error:\", insertError);\n                }\n            }\n        } catch (err) {\n            console.error(\"❌ Error parsing message:\", err);\n            results.push({\n                error: \"Failed to parse\",\n                id: msg.id\n            });\n        }\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        messages: results\n    }, {\n        status: 200\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LGtCQUFrQlosT0FBT1ksZ0JBQWdCO29CQUN6Q0MsaUJBQWlCYixPQUFPYSxlQUFlO2dCQUN6QztnQkFFQSxNQUFNLEVBQUVyRyxPQUFPc0csV0FBVyxFQUFFLEdBQUcsTUFBTTdHLHlEQUFRQSxDQUFDWSxJQUFJLENBQUMsaUJBQWlCa0csTUFBTSxDQUFDO29CQUN6RUMsU0FBUzlGO29CQUNUK0YsY0FBY2pCLE9BQU9XLFdBQVcsSUFBSTtvQkFDcENQLFFBQVFJO29CQUNSRixVQUFVRztvQkFDVkcsa0JBQWtCWixPQUFPWSxnQkFBZ0IsSUFBSTtvQkFDN0NNLG9CQUFvQnBELElBQUkzQyxFQUFFO2dCQUM1QjtnQkFFQSxJQUFJMkYsYUFBYTtvQkFDZjdGLFFBQVFULEtBQUssQ0FBQyw0QkFBNEJzRztnQkFDNUM7WUFDRjtRQUNGLEVBQUUsT0FBT0ssS0FBSztZQUNabEcsUUFBUVQsS0FBSyxDQUFDLDRCQUE0QjJHO1lBQzFDaEYsUUFBUXVFLElBQUksQ0FBQztnQkFBRWxHLE9BQU87Z0JBQW1CVyxJQUFJMkMsSUFBSTNDLEVBQUU7WUFBQztRQUN0RDtJQUNGO0lBRUEsT0FBT3RCLHFEQUFZQSxDQUFDVSxJQUFJLENBQUM7UUFBRXdCLFVBQVVJO0lBQVEsR0FBRztRQUFFMUIsUUFBUTtJQUFJO0FBQ2hFIiwic291cmNlcyI6WyIvVXNlcnMva2hpemFybWFsaWsvcmVwb3MvZW1haWwtc3Vicy9hcHAvYXBpL2dtYWlsL3NjYW4vcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ29vZ2xlIH0gZnJvbSBcImdvb2dsZWFwaXNcIlxuaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiXG5pbXBvcnQgeyBnZXRUb2tlbiB9IGZyb20gXCJuZXh0LWF1dGgvand0XCJcbmltcG9ydCB7IEpTRE9NIH0gZnJvbSBcImpzZG9tXCJcbmltcG9ydCB7IG9wZW5haSB9IGZyb20gXCJAL2xpYi9vcGVuYWlDbGllbnRcIlxuaW1wb3J0IHsgc3VwYWJhc2UgfSBmcm9tIFwiQC9saWIvc3VwYWJhc2VDbGllbnRcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcTogTmV4dFJlcXVlc3QpIHtcbiAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbih7IHJlcSB9KVxuXG4gIGlmICghdG9rZW4/LmFjY2Vzc1Rva2VuIHx8ICF0b2tlbi5zdWIpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJOb3QgYXV0aGVudGljYXRlZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSlcbiAgfVxuXG4gIGNvbnN0IHsgZGF0YTogdXNlclJlY29yZCwgZXJyb3I6IHVzZXJFcnIgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgLmZyb20oXCJ1c2Vyc1wiKVxuICAgIC5zZWxlY3QoXCJpZFwiKVxuICAgIC5lcShcImF1dGhfcHJvdmlkZXJfaWRcIiwgdG9rZW4uc3ViKVxuICAgIC5tYXliZVNpbmdsZSgpXG5cbiAgaWYgKHVzZXJFcnIgfHwgIXVzZXJSZWNvcmQpIHtcbiAgICBjb25zb2xlLmVycm9yKFwi4p2MIENvdWxkIG5vdCBmaW5kIHVzZXIgd2l0aCBhdXRoX3Byb3ZpZGVyX2lkXCIsIHRva2VuLnN1YilcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHVzZXJJZCA9IHVzZXJSZWNvcmQuaWRcblxuICBjb25zdCBvYXV0aDJDbGllbnQgPSBuZXcgZ29vZ2xlLmF1dGguT0F1dGgyKClcbiAgb2F1dGgyQ2xpZW50LnNldENyZWRlbnRpYWxzKHtcbiAgICBhY2Nlc3NfdG9rZW46IHRva2VuLmFjY2Vzc1Rva2VuLFxuICAgIHJlZnJlc2hfdG9rZW46IHRva2VuLnJlZnJlc2hUb2tlbixcbiAgfSlcblxuICBjb25zdCBnbWFpbCA9IGdvb2dsZS5nbWFpbCh7IHZlcnNpb246IFwidjFcIiwgYXV0aDogb2F1dGgyQ2xpZW50IH0pXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGdtYWlsLnVzZXJzLm1lc3NhZ2VzLmxpc3Qoe1xuICAgIHVzZXJJZDogXCJtZVwiLFxuICAgIHE6ICduZXdlcl90aGFuOjYwZCBzdWJqZWN0OihyZWNlaXB0IE9SIHN1YnNjcmlwdGlvbiBPUiBwYXltZW50KScsXG4gICAgbWF4UmVzdWx0czogNTAsXG4gIH0pXG5cbiAgY29uc3QgbWVzc2FnZXMgPSByZXMuZGF0YS5tZXNzYWdlcyB8fCBbXVxuICBjb25zdCByZXN1bHRzID0gW11cblxuICBmdW5jdGlvbiBleHRyYWN0Qm9keVRleHQocGF5bG9hZDogYW55KTogc3RyaW5nIHtcbiAgICBmdW5jdGlvbiBmaW5kUGFydChwYXJ0OiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgIGlmIChwYXJ0Lm1pbWVUeXBlID09PSBcInRleHQvaHRtbFwiKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBwYXJ0LmJvZHk/LmRhdGFcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICBjb25zdCBkZWNvZGVkID0gQnVmZmVyLmZyb20oZGF0YSwgXCJiYXNlNjRcIikudG9TdHJpbmcoXCJ1dGY4XCIpXG4gICAgICAgICAgY29uc3QgZG9tID0gbmV3IEpTRE9NKGRlY29kZWQpXG4gICAgICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBkb20ud2luZG93LmRvY3VtZW50LmJvZHkudGV4dENvbnRlbnQgfHwgXCJcIlxuICBcbiAgICAgICAgICAvLyDirIfvuI8gR3JhYiBhbGwgdGFibGUgY29udGVudCBhcyByYXcgc3RyaW5ncyB0byBhdm9pZCBmbGF0dGVuaW5nIGxvc3Nlc1xuICAgICAgICAgIGNvbnN0IHRkVmFsdWVzID0gQXJyYXkuZnJvbShkb20ud2luZG93LmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0ZCwgdGgsIHBcIikpXG4gICAgICAgICAgICAubWFwKGVsID0+IGVsLnRleHRDb250ZW50Py50cmltKCkpXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbihcIiB8IFwiKVxuICBcbiAgICAgICAgICByZXR1cm4gYCR7dGV4dENvbnRlbnR9XFxuXFxuRXh0cmE6ICR7dGRWYWx1ZXN9YFxuICAgICAgICB9XG4gICAgICB9XG4gIFxuICAgICAgaWYgKHBhcnQubWltZVR5cGUgPT09IFwidGV4dC9wbGFpblwiKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBwYXJ0LmJvZHk/LmRhdGFcbiAgICAgICAgcmV0dXJuIGRhdGEgPyBCdWZmZXIuZnJvbShkYXRhLCBcImJhc2U2NFwiKS50b1N0cmluZyhcInV0ZjhcIikgOiBcIlwiXG4gICAgICB9XG4gIFxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFydC5wYXJ0cykpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBwYXJ0LnBhcnRzKSB7XG4gICAgICAgICAgY29uc3QgZm91bmQgPSBmaW5kUGFydChjaGlsZClcbiAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZFxuICAgICAgICB9XG4gICAgICB9XG4gIFxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIFxuICAgIHJldHVybiBmaW5kUGFydChwYXlsb2FkKSB8fCBcIlwiXG4gIH1cbiAgXG5cbiAgZm9yIChjb25zdCBtc2cgb2YgbWVzc2FnZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbXNnRGF0YSA9IGF3YWl0IGdtYWlsLnVzZXJzLm1lc3NhZ2VzLmdldCh7XG4gICAgICAgIHVzZXJJZDogXCJtZVwiLFxuICAgICAgICBpZDogbXNnLmlkISxcbiAgICAgICAgZm9ybWF0OiBcImZ1bGxcIixcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGhlYWRlcnMgPSBtc2dEYXRhLmRhdGEucGF5bG9hZD8uaGVhZGVycyB8fCBbXVxuICAgICAgY29uc3Qgc3ViamVjdCA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gXCJTdWJqZWN0XCIpPy52YWx1ZSB8fCBcIlwiXG4gICAgICBjb25zdCBmcm9tID0gaGVhZGVycy5maW5kKGggPT4gaC5uYW1lID09PSBcIkZyb21cIik/LnZhbHVlIHx8IFwiXCJcbiAgICAgIGNvbnN0IGRhdGUgPSBoZWFkZXJzLmZpbmQoaCA9PiBoLm5hbWUgPT09IFwiRGF0ZVwiKT8udmFsdWUgfHwgXCJcIlxuICAgICAgY29uc3QgYm9keVRleHQgPSBleHRyYWN0Qm9keVRleHQobXNnRGF0YS5kYXRhLnBheWxvYWQpXG4gICAgICBjb25zdCBjdXJyZW5jeU1hdGNoID0gYm9keVRleHQubWF0Y2goLyg/OlxcJHxVU0R8Q0FEfGRvbGxhcnM/KVxccyooWzAtOV0rKD86XFwuWzAtOV17Mn0pPykvaSlcblxuICAgICAgY29uc3QgaXNSZWNlaXB0ID0gc3ViamVjdC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwicmVjZWlwdFwiKVxuICAgICAgaWYgKCFpc1JlY2VpcHQgJiYgIWN1cnJlbmN5TWF0Y2gpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn5uRIFNraXBwaW5nIGR1ZSB0byBubyBjdXJyZW5jeSBtYXRjaDpcIiwgc3ViamVjdClcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIFxuXG4gICAgICAvLyDwn6egIEJhc2ljIHNwYW0vc2NhbSBkZXRlY3Rpb246IGlnbm9yZSBlbWFpbHMgd2l0aCBcImNoZWNrXCIgb3IgXCJkZXBvc2l0XCIgYW5kIG5vIHZlbmRvciBkb21haW5cbiAgICAgIGNvbnN0IGxvd2VyQm9keSA9IGJvZHlUZXh0LnRvTG93ZXJDYXNlKClcbiAgICAgIGlmIChsb3dlckJvZHkuaW5jbHVkZXMoXCJjaGVja1wiKSAmJiBsb3dlckJvZHkuaW5jbHVkZXMoXCJkZXBvc2l0XCIpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi4pqg77iPIFNraXBwaW5nIGVtYWlsIGxpa2VseSBhYm91dCBhIGNoZWNrLCBub3QgYSBjaGFyZ2U6XCIsIHN1YmplY3QpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb21wdCA9IGBcbiAgICAgICAgWW91IGFyZSBhIGJpbGxpbmcgZW1haWwgcGFyc2VyLiBZb3VyIGpvYiBpcyB0byBleHRyYWN0IGJpbGxpbmcgZGV0YWlscyAqKm9ubHkgaWYgdGhlIHVzZXIgaXMgYmVpbmcgY2hhcmdlZCBvciBiaWxsZWQqKi5cblxuICAgICAgICBZb3UgTVVTVCBOT1QgZXh0cmFjdCBkYXRhIGlmIHRoZSBlbWFpbCBpczpcbiAgICAgICAgLSBhYm91dCBhIGNoZWNrIGJlaW5nIHNlbnQgVE8gdGhlIHVzZXJcbiAgICAgICAgLSBhIHJlZnVuZCBvciByZWltYnVyc2VtZW50XG4gICAgICAgIC0ganVzdCBhIG5vdGlmaWNhdGlvbiBvciBtYXJrZXRpbmcgZW1haWxcbiAgICAgICAgLSBhIHJlY2VpcHQgd2l0aG91dCBhbiBhbW91bnQgY2hhcmdlZFxuXG4gICAgICAgIE9ubHkgZXh0cmFjdCB0aGUgZGF0YSBpZiB0aGUgYW1vdW50IGlzIGFzc29jaWF0ZWQgd2l0aCBhIGN1cnJlbmN5IChsaWtlICQgb3IgVVNEIG9yIENBRCBvciBkb2xsYXJzKS5cblxuICAgICAgICBZb3VyIHJlc3BvbnNlIG11c3QgYmUgYSBzdHJpY3QgSlNPTiBvYmplY3QgbGlrZSB0aGlzOlxuICAgICAgICB7XG4gICAgICAgIFwidmVuZG9yX25hbWVcIjogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgXCJhbW91bnRcIjogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgXCJjdXJyZW5jeVwiOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICBcImJpbGxpbmdfaW50ZXJ2YWxcIjogXCJtb250aGx5XCIgfCBcInllYXJseVwiIHwgXCJ3ZWVrbHlcIiB8IFwib25lLXRpbWVcIiB8IG51bGwsXG4gICAgICAgIFwiaXNfc3Vic2NyaXB0aW9uXCI6IGJvb2xlYW5cbiAgICAgICAgfVxuXG4gICAgICAgIEdpdmVuIHRoZSBmb2xsb3dpbmcgZW1haWwgbWV0YWRhdGEgYW5kIGJvZHksIGV4dHJhY3Qgc3RydWN0dXJlZCBkYXRhICoqb25seSBpZiB0aGVyZSB3YXMgYSByZWFsIHBheW1lbnQgY2hhcmdlZCB0byB0aGUgdXNlcioqOlxuXG4gICAgICAgIFN1YmplY3Q6IFwiJHtzdWJqZWN0fVwiXG4gICAgICAgIEZyb206IFwiJHtmcm9tfVwiXG4gICAgICAgIEJvZHk6XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAke2JvZHlUZXh0LnNsaWNlKDAsIDMwMDApfVxuICAgICAgICBcIlwiXCJcbiAgICAgIGBcblxuICAgICAgY29uc3QgY29tcGxldGlvbiA9IGF3YWl0IG9wZW5haS5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIG1vZGVsOiBcImdwdC0zLjUtdHVyYm9cIixcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICB7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IFwiWW91IGFyZSBhIGJpbGxpbmcgZW1haWwgcGFyc2VyLlwiIH0sXG4gICAgICAgICAgeyByb2xlOiBcInVzZXJcIiwgY29udGVudDogcHJvbXB0IH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjIsXG4gICAgICB9KVxuXG4gICAgICBjb25zdCBqc29uU3RyID0gY29tcGxldGlvbi5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudCB8fCBcInt9XCJcbiAgICAgIGNvbnN0IGNsZWFuID0ganNvblN0ci5yZXBsYWNlKC9gYGBqc29ufGBgYC9nLCBcIlwiKS50cmltKClcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoY2xlYW4pXG5cbiAgICAgIGxldCBmYWxsYmFja0Ftb3VudCA9IHBhcnNlZC5hbW91bnRcbiAgICAgIGxldCBmYWxsYmFja0N1cnJlbmN5ID0gcGFyc2VkLmN1cnJlbmN5XG5cbiAgICAgIGlmIChmYWxsYmFja0Ftb3VudCA9PSBudWxsIHx8IGZhbGxiYWNrQ3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IGJvZHlUZXh0Lm1hdGNoKC8oPzpcXCR8VVNEfENBRHxkb2xsYXJzPylcXHMqKFswLTldKyg/OlxcLlswLTldezJ9KT8pL2kpXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGZhbGxiYWNrQW1vdW50ID0gcGFyc2VGbG9hdChtYXRjaFsxXSlcbiAgICAgICAgICBmYWxsYmFja0N1cnJlbmN5ID0gbWF0Y2hbMF0uaW5jbHVkZXMoXCJVU0RcIikgPyBcIlVTRFwiIDogbWF0Y2hbMF0uaW5jbHVkZXMoXCJDQURcIikgPyBcIkNBRFwiIDogXCIkXCJcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaW5hbEFtb3VudCA9IGZhbGxiYWNrQW1vdW50ID8/IG51bGxcbiAgICAgIGNvbnN0IGZpbmFsQ3VycmVuY3kgPSBmYWxsYmFja0N1cnJlbmN5ID8/IG51bGxcblxuICAgICAgLy8g8J+RgCBPbmx5IHNhdmUgaWYgYm90aCBhbW91bnQgYW5kIGN1cnJlbmN5IGFyZSB2YWxpZFxuICAgICAgaWYgKGZpbmFsQW1vdW50ICE9PSBudWxsICYmIGZpbmFsQ3VycmVuY3kgIT09IG51bGwpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBzdWJqZWN0LFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgZGF0ZSxcbiAgICAgICAgICB2ZW5kb3JfbmFtZTogcGFyc2VkLnZlbmRvcl9uYW1lLFxuICAgICAgICAgIGFtb3VudDogZmluYWxBbW91bnQsXG4gICAgICAgICAgY3VycmVuY3k6IGZpbmFsQ3VycmVuY3ksXG4gICAgICAgICAgYmlsbGluZ19pbnRlcnZhbDogcGFyc2VkLmJpbGxpbmdfaW50ZXJ2YWwsXG4gICAgICAgICAgaXNfc3Vic2NyaXB0aW9uOiBwYXJzZWQuaXNfc3Vic2NyaXB0aW9uLFxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IGluc2VydEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwic3Vic2NyaXB0aW9uc1wiKS5pbnNlcnQoe1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICBzZXJ2aWNlX25hbWU6IHBhcnNlZC52ZW5kb3JfbmFtZSB8fCBcIlVua25vd25cIixcbiAgICAgICAgICBhbW91bnQ6IGZpbmFsQW1vdW50LFxuICAgICAgICAgIGN1cnJlbmN5OiBmaW5hbEN1cnJlbmN5LFxuICAgICAgICAgIGJpbGxpbmdfaW50ZXJ2YWw6IHBhcnNlZC5iaWxsaW5nX2ludGVydmFsIHx8IFwib25lLXRpbWVcIixcbiAgICAgICAgICBsYXN0X3NlZW5fZW1haWxfaWQ6IG1zZy5pZCEsXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKGluc2VydEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIuKdjCBTdXBhYmFzZSBpbnNlcnQgZXJyb3I6XCIsIGluc2VydEVycm9yKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwi4p2MIEVycm9yIHBhcnNpbmcgbWVzc2FnZTpcIiwgZXJyKVxuICAgICAgcmVzdWx0cy5wdXNoKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHBhcnNlXCIsIGlkOiBtc2cuaWQgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBtZXNzYWdlczogcmVzdWx0cyB9LCB7IHN0YXR1czogMjAwIH0pXG59XG4iXSwibmFtZXMiOlsiZ29vZ2xlIiwiTmV4dFJlc3BvbnNlIiwiZ2V0VG9rZW4iLCJKU0RPTSIsIm9wZW5haSIsInN1cGFiYXNlIiwiR0VUIiwicmVxIiwidG9rZW4iLCJhY2Nlc3NUb2tlbiIsInN1YiIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImRhdGEiLCJ1c2VyUmVjb3JkIiwidXNlckVyciIsImZyb20iLCJzZWxlY3QiLCJlcSIsIm1heWJlU2luZ2xlIiwiY29uc29sZSIsInVzZXJJZCIsImlkIiwib2F1dGgyQ2xpZW50IiwiYXV0aCIsIk9BdXRoMiIsInNldENyZWRlbnRpYWxzIiwiYWNjZXNzX3Rva2VuIiwicmVmcmVzaF90b2tlbiIsInJlZnJlc2hUb2tlbiIsImdtYWlsIiwidmVyc2lvbiIsInJlcyIsInVzZXJzIiwibWVzc2FnZXMiLCJsaXN0IiwicSIsIm1heFJlc3VsdHMiLCJyZXN1bHRzIiwiZXh0cmFjdEJvZHlUZXh0IiwicGF5bG9hZCIsImZpbmRQYXJ0IiwicGFydCIsIm1pbWVUeXBlIiwiYm9keSIsImRlY29kZWQiLCJCdWZmZXIiLCJ0b1N0cmluZyIsImRvbSIsInRleHRDb250ZW50Iiwid2luZG93IiwiZG9jdW1lbnQiLCJ0ZFZhbHVlcyIsIkFycmF5IiwicXVlcnlTZWxlY3RvckFsbCIsIm1hcCIsImVsIiwidHJpbSIsImZpbHRlciIsIkJvb2xlYW4iLCJqb2luIiwiaXNBcnJheSIsInBhcnRzIiwiY2hpbGQiLCJmb3VuZCIsIm1zZyIsIm1zZ0RhdGEiLCJnZXQiLCJmb3JtYXQiLCJoZWFkZXJzIiwic3ViamVjdCIsImZpbmQiLCJoIiwibmFtZSIsInZhbHVlIiwiZGF0ZSIsImJvZHlUZXh0IiwiY3VycmVuY3lNYXRjaCIsIm1hdGNoIiwiaXNSZWNlaXB0IiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsImxvZyIsImxvd2VyQm9keSIsInByb21wdCIsInNsaWNlIiwiY29tcGxldGlvbiIsImNoYXQiLCJjb21wbGV0aW9ucyIsImNyZWF0ZSIsIm1vZGVsIiwicm9sZSIsImNvbnRlbnQiLCJ0ZW1wZXJhdHVyZSIsImpzb25TdHIiLCJjaG9pY2VzIiwibWVzc2FnZSIsImNsZWFuIiwicmVwbGFjZSIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsImZhbGxiYWNrQW1vdW50IiwiYW1vdW50IiwiZmFsbGJhY2tDdXJyZW5jeSIsImN1cnJlbmN5IiwicGFyc2VGbG9hdCIsImZpbmFsQW1vdW50IiwiZmluYWxDdXJyZW5jeSIsInB1c2giLCJ2ZW5kb3JfbmFtZSIsImJpbGxpbmdfaW50ZXJ2YWwiLCJpc19zdWJzY3JpcHRpb24iLCJpbnNlcnRFcnJvciIsImluc2VydCIsInVzZXJfaWQiLCJzZXJ2aWNlX25hbWUiLCJsYXN0X3NlZW5fZW1haWxfaWQiLCJlcnIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/gmail/scan/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/openaiClient.ts":
/*!*****************************!*\
  !*** ./lib/openaiClient.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   openai: () => (/* binding */ openai)\n/* harmony export */ });\n/* harmony import */ var openai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! openai */ \"(rsc)/./node_modules/openai/index.mjs\");\n\nconst openai = new openai__WEBPACK_IMPORTED_MODULE_0__[\"default\"]({\n    apiKey: process.env.OPENAI_API_KEY\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvb3BlbmFpQ2xpZW50LnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQTJCO0FBRXBCLE1BQU1DLFNBQVMsSUFBSUQsOENBQU1BLENBQUM7SUFDL0JFLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsY0FBYztBQUNwQyxHQUFFIiwic291cmNlcyI6WyIvVXNlcnMva2hpemFybWFsaWsvcmVwb3MvZW1haWwtc3Vicy9saWIvb3BlbmFpQ2xpZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSBcIm9wZW5haVwiXG5cbmV4cG9ydCBjb25zdCBvcGVuYWkgPSBuZXcgT3BlbkFJKHtcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5PUEVOQUlfQVBJX0tFWSxcbn0pXG4iXSwibmFtZXMiOlsiT3BlbkFJIiwib3BlbmFpIiwiYXBpS2V5IiwicHJvY2VzcyIsImVudiIsIk9QRU5BSV9BUElfS0VZIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/openaiClient.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabaseClient.ts":
/*!*******************************!*\
  !*** ./lib/supabaseClient.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\nconst supabaseUrl = \"https://caoivbabwqjvwmwjxprt.supabase.co\";\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhb2l2YmFid3Fqdndtd2p4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NzU1NDYsImV4cCI6MjA2MDE1MTU0Nn0.vb0q5iK7vGw9dP_2nfXXimMGfnAglg800RYOqTtAv2o\";\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2VDbGllbnQudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBb0Q7QUFFcEQsTUFBTUMsY0FBY0MsMENBQW9DO0FBQ3hELE1BQU1HLGtCQUFrQkgsa05BQXlDO0FBRTFELE1BQU1LLFdBQVdQLG1FQUFZQSxDQUFDQyxhQUFhSSxpQkFBZ0IiLCJzb3VyY2VzIjpbIi9Vc2Vycy9raGl6YXJtYWxpay9yZXBvcy9lbWFpbC1zdWJzL2xpYi9zdXBhYmFzZUNsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJcblxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhXG5jb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWSFcblxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpXG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50Iiwic3VwYWJhc2VVcmwiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwic3VwYWJhc2VBbm9uS2V5IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJzdXBhYmFzZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabaseClient.ts\n");

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

/***/ "jsdom":
/*!************************!*\
  !*** external "jsdom" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("jsdom");

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

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ "node:process":
/*!*******************************!*\
  !*** external "node:process" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:process");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ "node:stream/web":
/*!**********************************!*\
  !*** external "node:stream/web" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream/web");

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

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("worker_threads");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/uuid","vendor-chunks/@panva","vendor-chunks/formdata-node","vendor-chunks/googleapis","vendor-chunks/openai","vendor-chunks/@supabase","vendor-chunks/google-auth-library","vendor-chunks/googleapis-common","vendor-chunks/gaxios","vendor-chunks/form-data-encoder","vendor-chunks/math-intrinsics","vendor-chunks/es-errors","vendor-chunks/whatwg-url","vendor-chunks/qs","vendor-chunks/jws","vendor-chunks/call-bind-apply-helpers","vendor-chunks/debug","vendor-chunks/agentkeepalive","vendor-chunks/json-bigint","vendor-chunks/google-logging-utils","vendor-chunks/get-proto","vendor-chunks/tr46","vendor-chunks/object-inspect","vendor-chunks/https-proxy-agent","vendor-chunks/has-symbols","vendor-chunks/gopd","vendor-chunks/gcp-metadata","vendor-chunks/function-bind","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/agent-base","vendor-chunks/web-streams-polyfill","vendor-chunks/node-fetch","vendor-chunks/webidl-conversions","vendor-chunks/url-template","vendor-chunks/side-channel","vendor-chunks/side-channel-weakmap","vendor-chunks/side-channel-map","vendor-chunks/side-channel-list","vendor-chunks/safe-buffer","vendor-chunks/ms","vendor-chunks/jwa","vendor-chunks/is-stream","vendor-chunks/humanize-ms","vendor-chunks/hasown","vendor-chunks/gtoken","vendor-chunks/get-intrinsic","vendor-chunks/extend","vendor-chunks/event-target-shim","vendor-chunks/es-object-atoms","vendor-chunks/es-define-property","vendor-chunks/dunder-proto","vendor-chunks/call-bound","vendor-chunks/buffer-equal-constant-time","vendor-chunks/bignumber.js","vendor-chunks/base64-js","vendor-chunks/abort-controller"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();