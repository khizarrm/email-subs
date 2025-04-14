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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var googleapis__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! googleapis */ \"(rsc)/./node_modules/.pnpm/googleapis@148.0.0/node_modules/googleapis/build/src/index.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/jwt */ \"(rsc)/./node_modules/.pnpm/next-auth@4.24.11_@auth+core@0.38.0_nodemailer@6.10.1__next@15.2.4_react-dom@19.1.0_rea_8bf361c9c3c509dc8f6c14628e52f426/node_modules/next-auth/jwt/index.js\");\n/* harmony import */ var next_auth_jwt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var jsdom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jsdom */ \"jsdom\");\n/* harmony import */ var jsdom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(jsdom__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_openaiClient__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/openaiClient */ \"(rsc)/./lib/openaiClient.ts\");\n/* harmony import */ var _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/lib/supabaseClient */ \"(rsc)/./lib/supabaseClient.ts\");\n\n\n\n\n\n\nasync function GET(req) {\n    console.log(\"📧 /api/gmail/scan Starting...\");\n    console.time(\"/api/gmail/scan duration\");\n    console.log(\"Getting token...\");\n    const token = await (0,next_auth_jwt__WEBPACK_IMPORTED_MODULE_1__.getToken)({\n        req\n    });\n    if (!token?.accessToken || !token.sub) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Not authenticated\"\n        }, {\n            status: 401\n        });\n    }\n    console.log(\"🧠 Authenticated token.sub (user id):\", token.sub);\n    console.log(\"📧 Authenticated token.email:\", token.email);\n    console.log(\"Getting user token...\");\n    const { data: userRecord, error: userErr } = await _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_4__.supabase.from(\"users\").select(\"id\").eq(\"auth_provider_id\", token.sub).maybeSingle();\n    if (userErr) {\n        console.error(\"❌ Supabase user query error:\", userErr);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"User fetch failed\"\n        }, {\n            status: 500\n        });\n    }\n    if (!userRecord) {\n        console.error(\"❌ Could not find user with auth_provider_id\", token.sub);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"User not found\"\n        }, {\n            status: 404\n        });\n    }\n    const userId = userRecord.id;\n    console.log(\"Calling oauth2 client...\");\n    const oauth2Client = new googleapis__WEBPACK_IMPORTED_MODULE_5__.google.auth.OAuth2();\n    oauth2Client.setCredentials({\n        access_token: token.accessToken,\n        refresh_token: token.refreshToken\n    });\n    console.log(\"📧 Fetching Gmail messages...\");\n    let messages = [];\n    try {\n        const gmail = googleapis__WEBPACK_IMPORTED_MODULE_5__.google.gmail({\n            version: \"v1\",\n            auth: oauth2Client\n        });\n        const res = await gmail.users.messages.list({\n            userId: \"me\",\n            q: 'newer_than:60d subject:(receipt OR subscription OR payment)',\n            maxResults: 50\n        });\n        messages = res.data.messages || [];\n    } catch (err) {\n        console.error(\"📨 Gmail list error:\", err);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to fetch Gmail messages\"\n        }, {\n            status: 500\n        });\n    }\n    console.log(\"📧 Found messages:\", messages.length);\n    const results = [];\n    console.log(\"Extracting body text...\");\n    function extractBodyText(payload) {\n        function findPart(part) {\n            if (part.mimeType === \"text/html\") {\n                const data = part.body?.data;\n                if (data) {\n                    const decoded = Buffer.from(data, \"base64\").toString(\"utf8\");\n                    const dom = new jsdom__WEBPACK_IMPORTED_MODULE_2__.JSDOM(decoded);\n                    const textContent = dom.window.document.body.textContent || \"\";\n                    const tdValues = Array.from(dom.window.document.querySelectorAll(\"td, th, p\")).map((el)=>el.textContent?.trim()).filter(Boolean).join(\" | \");\n                    return `${textContent}\\n\\nExtra: ${tdValues}`;\n                }\n            }\n            if (part.mimeType === \"text/plain\") {\n                const data = part.body?.data;\n                return data ? Buffer.from(data, \"base64\").toString(\"utf8\") : \"\";\n            }\n            if (Array.isArray(part.parts)) {\n                for (const child of part.parts){\n                    const found = findPart(child);\n                    if (found) return found;\n                }\n            }\n            return null;\n        }\n        return findPart(payload) || \"\";\n    }\n    console.log(\"📧 Parsing messages...\");\n    for (const msg of messages){\n        try {\n            const gmail = googleapis__WEBPACK_IMPORTED_MODULE_5__.google.gmail({\n                version: \"v1\",\n                auth: oauth2Client\n            });\n            const msgData = await gmail.users.messages.get({\n                userId: \"me\",\n                id: msg.id,\n                format: \"full\"\n            });\n            const headers = msgData.data.payload?.headers || [];\n            const subject = headers.find((h)=>h.name === \"Subject\")?.value || \"\";\n            const from = headers.find((h)=>h.name === \"From\")?.value || \"\";\n            const date = headers.find((h)=>h.name === \"Date\")?.value || \"\";\n            const bodyText = extractBodyText(msgData.data.payload);\n            const currencyMatch = bodyText.match(/(?:\\$|USD|CAD|dollars?)\\s*([0-9]+(?:\\.[0-9]{2})?)/i);\n            const isReceipt = subject.toLowerCase().includes(\"receipt\");\n            if (!isReceipt && !currencyMatch) {\n                console.log(\"🛑 Skipping due to no currency match:\", subject);\n                continue;\n            }\n            const lowerBody = bodyText.toLowerCase();\n            if (lowerBody.includes(\"check\") && lowerBody.includes(\"deposit\")) {\n                console.log(\"⚠️ Skipping email likely about a check, not a charge:\", subject);\n                continue;\n            }\n            console.log(\"📧 Parsing email with OpenAI...\");\n            const prompt = `\n        You are a billing email parser. Your job is to extract billing details **only if the user is being charged or billed**.\n\n        You MUST NOT extract data if the email is:\n        - about a check being sent TO the user\n        - a refund or reimbursement\n        - just a notification or marketing email\n        - a receipt without an amount charged\n\n        Only extract the data if the amount is associated with a currency (like $ or USD or CAD or dollars).\n\n        Your response must be a strict JSON object like this:\n        {\n        \"vendor_name\": string | null,\n        \"amount\": number | null,\n        \"currency\": string | null,\n        \"billing_interval\": \"monthly\" | \"yearly\" | \"weekly\" | \"one-time\" | null,\n        \"is_subscription\": boolean\n        }\n\n        Given the following email metadata and body, extract structured data **only if there was a real payment charged to the user**:\n\n        Subject: \"${subject}\"\n        From: \"${from}\"\n        Body:\n        \"\"\"\n        ${bodyText.slice(0, 3000)}\n        \"\"\"\n      `;\n            let parsed = {};\n            try {\n                const completion = await _lib_openaiClient__WEBPACK_IMPORTED_MODULE_3__.openai.chat.completions.create({\n                    model: \"gpt-3.5-turbo\",\n                    messages: [\n                        {\n                            role: \"system\",\n                            content: \"You are a billing email parser.\"\n                        },\n                        {\n                            role: \"user\",\n                            content: prompt\n                        }\n                    ],\n                    temperature: 0.2\n                });\n                const jsonStr = completion.choices[0].message.content || \"{}\";\n                const clean = jsonStr.replace(/```json|```/g, \"\").trim();\n                parsed = JSON.parse(clean);\n            } catch (err) {\n                console.error(\"❌ OpenAI parsing failed:\", err);\n                continue;\n            }\n            let fallbackAmount = parsed.amount;\n            let fallbackCurrency = parsed.currency;\n            if (fallbackAmount == null || fallbackCurrency == null) {\n                const match = bodyText.match(/(?:\\$|USD|CAD|dollars?)\\s*([0-9]+(?:\\.[0-9]{2})?)/i);\n                if (match) {\n                    fallbackAmount = parseFloat(match[1]);\n                    fallbackCurrency = match[0].includes(\"USD\") ? \"USD\" : match[0].includes(\"CAD\") ? \"CAD\" : \"$\";\n                }\n            }\n            const finalAmount = fallbackAmount ?? null;\n            const finalCurrency = fallbackCurrency ?? null;\n            if (finalAmount !== null && finalCurrency !== null) {\n                results.push({\n                    subject,\n                    from,\n                    date,\n                    vendor_name: parsed.vendor_name,\n                    amount: finalAmount,\n                    currency: finalCurrency,\n                    billing_interval: parsed.billing_interval,\n                    is_subscription: parsed.is_subscription\n                });\n                const { error: insertError } = await _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_4__.supabase.from(\"subscriptions\").insert({\n                    user_id: userId,\n                    service_name: parsed.vendor_name || \"Unknown\",\n                    amount: finalAmount,\n                    currency: finalCurrency,\n                    billing_interval: parsed.billing_interval || \"one-time\",\n                    last_seen_email_id: msg.id\n                });\n                if (insertError) {\n                    console.error(\"❌ Supabase insert error:\", insertError);\n                }\n            }\n        } catch (err) {\n            console.error(\"❌ Error parsing message:\", err);\n            results.push({\n                error: \"Failed to parse\",\n                id: msg.id\n            });\n        }\n    }\n    console.timeEnd(\"/api/gmail/scan duration\");\n    if (results.length === 0) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"No records found\",\n            messages: []\n        }, {\n            status: 200\n        });\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        messages: results\n    }, {\n        status: 200\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFPdUcsV0FBVyxFQUFFLEdBQUcsTUFBTWpILHlEQUFRQSxDQUFDZ0IsSUFBSSxDQUFDLGlCQUFpQmtHLE1BQU0sQ0FBQztvQkFDekVDLFNBQVMvRjtvQkFDVGdHLGNBQWM5QixPQUFPd0IsV0FBVyxJQUFJO29CQUNwQ1AsUUFBUUk7b0JBQ1JGLFVBQVVHO29CQUNWRyxrQkFBa0J6QixPQUFPeUIsZ0JBQWdCLElBQUk7b0JBQzdDTSxvQkFBb0JuRCxJQUFJN0MsRUFBRTtnQkFDNUI7Z0JBRUEsSUFBSTRGLGFBQWE7b0JBQ2Y5RyxRQUFRTyxLQUFLLENBQUMsNEJBQTRCdUc7Z0JBQzVDO1lBQ0Y7UUFDRixFQUFFLE9BQU81RSxLQUFLO1lBQ1psQyxRQUFRTyxLQUFLLENBQUMsNEJBQTRCMkI7WUFDMUNFLFFBQVFzRSxJQUFJLENBQUM7Z0JBQUVuRyxPQUFPO2dCQUFtQlcsSUFBSTZDLElBQUk3QyxFQUFFO1lBQUM7UUFDdEQ7SUFDRjtJQUVBbEIsUUFBUW1ILE9BQU8sQ0FBQztJQUVoQixJQUFJL0UsUUFBUUQsTUFBTSxLQUFLLEdBQUc7UUFDeEIsT0FBTzFDLHFEQUFZQSxDQUFDYSxJQUFJLENBQUM7WUFBRXdGLFNBQVM7WUFBb0JwRSxVQUFVLEVBQUU7UUFBQyxHQUFHO1lBQUVsQixRQUFRO1FBQUk7SUFDeEY7SUFFQSxPQUFPZixxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDO1FBQUVvQixVQUFVVTtJQUFRLEdBQUc7UUFBRTVCLFFBQVE7SUFBSTtBQUNoRSIsInNvdXJjZXMiOlsiL1VzZXJzL2toaXphcm1hbGlrL3JlcG9zL2VtYWlsLXN1YnMvYXBwL2FwaS9nbWFpbC9zY2FuL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdvb2dsZSB9IGZyb20gXCJnb29nbGVhcGlzXCJcbmltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIlxuaW1wb3J0IHsgZ2V0VG9rZW4gfSBmcm9tIFwibmV4dC1hdXRoL2p3dFwiXG5pbXBvcnQgeyBKU0RPTSB9IGZyb20gXCJqc2RvbVwiXG5pbXBvcnQgeyBvcGVuYWkgfSBmcm9tIFwiQC9saWIvb3BlbmFpQ2xpZW50XCJcbmltcG9ydCB7IHN1cGFiYXNlIH0gZnJvbSBcIkAvbGliL3N1cGFiYXNlQ2xpZW50XCJcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXE6IE5leHRSZXF1ZXN0KSB7XG4gIGNvbnNvbGUubG9nKFwi8J+TpyAvYXBpL2dtYWlsL3NjYW4gU3RhcnRpbmcuLi5cIilcbiAgY29uc29sZS50aW1lKFwiL2FwaS9nbWFpbC9zY2FuIGR1cmF0aW9uXCIpXG5cbiAgY29uc29sZS5sb2coXCJHZXR0aW5nIHRva2VuLi4uXCIpXG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0VG9rZW4oeyByZXEgfSlcblxuICBpZiAoIXRva2VuPy5hY2Nlc3NUb2tlbiB8fCAhdG9rZW4uc3ViKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiTm90IGF1dGhlbnRpY2F0ZWRcIiB9LCB7IHN0YXR1czogNDAxIH0pXG4gIH1cblxuICBjb25zb2xlLmxvZyhcIvCfp6AgQXV0aGVudGljYXRlZCB0b2tlbi5zdWIgKHVzZXIgaWQpOlwiLCB0b2tlbi5zdWIpXG4gIGNvbnNvbGUubG9nKFwi8J+TpyBBdXRoZW50aWNhdGVkIHRva2VuLmVtYWlsOlwiLCB0b2tlbi5lbWFpbClcblxuICBjb25zb2xlLmxvZyhcIkdldHRpbmcgdXNlciB0b2tlbi4uLlwiKVxuICBjb25zdCB7IGRhdGE6IHVzZXJSZWNvcmQsIGVycm9yOiB1c2VyRXJyIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgIC5mcm9tKFwidXNlcnNcIilcbiAgICAuc2VsZWN0KFwiaWRcIilcbiAgICAuZXEoXCJhdXRoX3Byb3ZpZGVyX2lkXCIsIHRva2VuLnN1YilcbiAgICAubWF5YmVTaW5nbGUoKVxuXG4gIGlmICh1c2VyRXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihcIuKdjCBTdXBhYmFzZSB1c2VyIHF1ZXJ5IGVycm9yOlwiLCB1c2VyRXJyKVxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIlVzZXIgZmV0Y2ggZmFpbGVkXCIgfSwgeyBzdGF0dXM6IDUwMCB9KVxuICB9XG5cbiAgaWYgKCF1c2VyUmVjb3JkKSB7XG4gICAgY29uc29sZS5lcnJvcihcIuKdjCBDb3VsZCBub3QgZmluZCB1c2VyIHdpdGggYXV0aF9wcm92aWRlcl9pZFwiLCB0b2tlbi5zdWIpXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiVXNlciBub3QgZm91bmRcIiB9LCB7IHN0YXR1czogNDA0IH0pXG4gIH1cblxuICBjb25zdCB1c2VySWQgPSB1c2VyUmVjb3JkLmlkXG5cbiAgY29uc29sZS5sb2coXCJDYWxsaW5nIG9hdXRoMiBjbGllbnQuLi5cIilcbiAgY29uc3Qgb2F1dGgyQ2xpZW50ID0gbmV3IGdvb2dsZS5hdXRoLk9BdXRoMigpXG4gIG9hdXRoMkNsaWVudC5zZXRDcmVkZW50aWFscyh7XG4gICAgYWNjZXNzX3Rva2VuOiB0b2tlbi5hY2Nlc3NUb2tlbixcbiAgICByZWZyZXNoX3Rva2VuOiB0b2tlbi5yZWZyZXNoVG9rZW4sXG4gIH0pXG5cbmNvbnNvbGUubG9nKFwi8J+TpyBGZXRjaGluZyBHbWFpbCBtZXNzYWdlcy4uLlwiKVxuICBsZXQgbWVzc2FnZXMgPSBbXVxuICB0cnkge1xuICAgIGNvbnN0IGdtYWlsID0gZ29vZ2xlLmdtYWlsKHsgdmVyc2lvbjogXCJ2MVwiLCBhdXRoOiBvYXV0aDJDbGllbnQgfSlcbiAgICBjb25zdCByZXMgPSBhd2FpdCBnbWFpbC51c2Vycy5tZXNzYWdlcy5saXN0KHtcbiAgICAgIHVzZXJJZDogXCJtZVwiLFxuICAgICAgcTogJ25ld2VyX3RoYW46NjBkIHN1YmplY3Q6KHJlY2VpcHQgT1Igc3Vic2NyaXB0aW9uIE9SIHBheW1lbnQpJyxcbiAgICAgIG1heFJlc3VsdHM6IDUwLFxuICAgIH0pXG4gICAgbWVzc2FnZXMgPSByZXMuZGF0YS5tZXNzYWdlcyB8fCBbXVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwi8J+TqCBHbWFpbCBsaXN0IGVycm9yOlwiLCBlcnIpXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiRmFpbGVkIHRvIGZldGNoIEdtYWlsIG1lc3NhZ2VzXCIgfSwgeyBzdGF0dXM6IDUwMCB9KVxuICB9XG5cbiAgY29uc29sZS5sb2coXCLwn5OnIEZvdW5kIG1lc3NhZ2VzOlwiLCBtZXNzYWdlcy5sZW5ndGgpXG4gIGNvbnN0IHJlc3VsdHMgPSBbXVxuXG4gIGNvbnNvbGUubG9nKFwiRXh0cmFjdGluZyBib2R5IHRleHQuLi5cIilcbiAgZnVuY3Rpb24gZXh0cmFjdEJvZHlUZXh0KHBheWxvYWQ6IGFueSk6IHN0cmluZyB7XG4gICAgZnVuY3Rpb24gZmluZFBhcnQocGFydDogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgICBpZiAocGFydC5taW1lVHlwZSA9PT0gXCJ0ZXh0L2h0bWxcIikge1xuICAgICAgICBjb25zdCBkYXRhID0gcGFydC5ib2R5Py5kYXRhXG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgY29uc3QgZGVjb2RlZCA9IEJ1ZmZlci5mcm9tKGRhdGEsIFwiYmFzZTY0XCIpLnRvU3RyaW5nKFwidXRmOFwiKVxuICAgICAgICAgIGNvbnN0IGRvbSA9IG5ldyBKU0RPTShkZWNvZGVkKVxuICAgICAgICAgIGNvbnN0IHRleHRDb250ZW50ID0gZG9tLndpbmRvdy5kb2N1bWVudC5ib2R5LnRleHRDb250ZW50IHx8IFwiXCJcbiAgICAgICAgICBjb25zdCB0ZFZhbHVlcyA9IEFycmF5LmZyb20oZG9tLndpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwidGQsIHRoLCBwXCIpKVxuICAgICAgICAgICAgLm1hcChlbCA9PiBlbC50ZXh0Q29udGVudD8udHJpbSgpKVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oXCIgfCBcIilcbiAgICAgICAgICByZXR1cm4gYCR7dGV4dENvbnRlbnR9XFxuXFxuRXh0cmE6ICR7dGRWYWx1ZXN9YFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXJ0Lm1pbWVUeXBlID09PSBcInRleHQvcGxhaW5cIikge1xuICAgICAgICBjb25zdCBkYXRhID0gcGFydC5ib2R5Py5kYXRhXG4gICAgICAgIHJldHVybiBkYXRhID8gQnVmZmVyLmZyb20oZGF0YSwgXCJiYXNlNjRcIikudG9TdHJpbmcoXCJ1dGY4XCIpIDogXCJcIlxuICAgICAgfVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJ0LnBhcnRzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHBhcnQucGFydHMpIHtcbiAgICAgICAgICBjb25zdCBmb3VuZCA9IGZpbmRQYXJ0KGNoaWxkKVxuICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICByZXR1cm4gZmluZFBhcnQocGF5bG9hZCkgfHwgXCJcIlxuICB9XG5cbiAgY29uc29sZS5sb2coXCLwn5OnIFBhcnNpbmcgbWVzc2FnZXMuLi5cIilcbiAgZm9yIChjb25zdCBtc2cgb2YgbWVzc2FnZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZ21haWwgPSBnb29nbGUuZ21haWwoeyB2ZXJzaW9uOiBcInYxXCIsIGF1dGg6IG9hdXRoMkNsaWVudCB9KVxuICAgICAgY29uc3QgbXNnRGF0YSA9IGF3YWl0IGdtYWlsLnVzZXJzLm1lc3NhZ2VzLmdldCh7XG4gICAgICAgIHVzZXJJZDogXCJtZVwiLFxuICAgICAgICBpZDogbXNnLmlkISxcbiAgICAgICAgZm9ybWF0OiBcImZ1bGxcIixcbiAgICAgIH0pXG4gICAgICBjb25zdCBoZWFkZXJzID0gbXNnRGF0YS5kYXRhLnBheWxvYWQ/LmhlYWRlcnMgfHwgW11cbiAgICAgIGNvbnN0IHN1YmplY3QgPSBoZWFkZXJzLmZpbmQoaCA9PiBoLm5hbWUgPT09IFwiU3ViamVjdFwiKT8udmFsdWUgfHwgXCJcIlxuICAgICAgY29uc3QgZnJvbSA9IGhlYWRlcnMuZmluZChoID0+IGgubmFtZSA9PT0gXCJGcm9tXCIpPy52YWx1ZSB8fCBcIlwiXG4gICAgICBjb25zdCBkYXRlID0gaGVhZGVycy5maW5kKGggPT4gaC5uYW1lID09PSBcIkRhdGVcIik/LnZhbHVlIHx8IFwiXCJcbiAgICAgIGNvbnN0IGJvZHlUZXh0ID0gZXh0cmFjdEJvZHlUZXh0KG1zZ0RhdGEuZGF0YS5wYXlsb2FkKVxuXG4gICAgICBjb25zdCBjdXJyZW5jeU1hdGNoID0gYm9keVRleHQubWF0Y2goLyg/OlxcJHxVU0R8Q0FEfGRvbGxhcnM/KVxccyooWzAtOV0rKD86XFwuWzAtOV17Mn0pPykvaSlcbiAgICAgIGNvbnN0IGlzUmVjZWlwdCA9IHN1YmplY3QudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcInJlY2VpcHRcIilcbiAgICAgIGlmICghaXNSZWNlaXB0ICYmICFjdXJyZW5jeU1hdGNoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+bkSBTa2lwcGluZyBkdWUgdG8gbm8gY3VycmVuY3kgbWF0Y2g6XCIsIHN1YmplY3QpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvd2VyQm9keSA9IGJvZHlUZXh0LnRvTG93ZXJDYXNlKClcbiAgICAgIGlmIChsb3dlckJvZHkuaW5jbHVkZXMoXCJjaGVja1wiKSAmJiBsb3dlckJvZHkuaW5jbHVkZXMoXCJkZXBvc2l0XCIpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi4pqg77iPIFNraXBwaW5nIGVtYWlsIGxpa2VseSBhYm91dCBhIGNoZWNrLCBub3QgYSBjaGFyZ2U6XCIsIHN1YmplY3QpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKFwi8J+TpyBQYXJzaW5nIGVtYWlsIHdpdGggT3BlbkFJLi4uXCIpXG4gICAgICBjb25zdCBwcm9tcHQgPSBgXG4gICAgICAgIFlvdSBhcmUgYSBiaWxsaW5nIGVtYWlsIHBhcnNlci4gWW91ciBqb2IgaXMgdG8gZXh0cmFjdCBiaWxsaW5nIGRldGFpbHMgKipvbmx5IGlmIHRoZSB1c2VyIGlzIGJlaW5nIGNoYXJnZWQgb3IgYmlsbGVkKiouXG5cbiAgICAgICAgWW91IE1VU1QgTk9UIGV4dHJhY3QgZGF0YSBpZiB0aGUgZW1haWwgaXM6XG4gICAgICAgIC0gYWJvdXQgYSBjaGVjayBiZWluZyBzZW50IFRPIHRoZSB1c2VyXG4gICAgICAgIC0gYSByZWZ1bmQgb3IgcmVpbWJ1cnNlbWVudFxuICAgICAgICAtIGp1c3QgYSBub3RpZmljYXRpb24gb3IgbWFya2V0aW5nIGVtYWlsXG4gICAgICAgIC0gYSByZWNlaXB0IHdpdGhvdXQgYW4gYW1vdW50IGNoYXJnZWRcblxuICAgICAgICBPbmx5IGV4dHJhY3QgdGhlIGRhdGEgaWYgdGhlIGFtb3VudCBpcyBhc3NvY2lhdGVkIHdpdGggYSBjdXJyZW5jeSAobGlrZSAkIG9yIFVTRCBvciBDQUQgb3IgZG9sbGFycykuXG5cbiAgICAgICAgWW91ciByZXNwb25zZSBtdXN0IGJlIGEgc3RyaWN0IEpTT04gb2JqZWN0IGxpa2UgdGhpczpcbiAgICAgICAge1xuICAgICAgICBcInZlbmRvcl9uYW1lXCI6IHN0cmluZyB8IG51bGwsXG4gICAgICAgIFwiYW1vdW50XCI6IG51bWJlciB8IG51bGwsXG4gICAgICAgIFwiY3VycmVuY3lcIjogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgXCJiaWxsaW5nX2ludGVydmFsXCI6IFwibW9udGhseVwiIHwgXCJ5ZWFybHlcIiB8IFwid2Vla2x5XCIgfCBcIm9uZS10aW1lXCIgfCBudWxsLFxuICAgICAgICBcImlzX3N1YnNjcmlwdGlvblwiOiBib29sZWFuXG4gICAgICAgIH1cblxuICAgICAgICBHaXZlbiB0aGUgZm9sbG93aW5nIGVtYWlsIG1ldGFkYXRhIGFuZCBib2R5LCBleHRyYWN0IHN0cnVjdHVyZWQgZGF0YSAqKm9ubHkgaWYgdGhlcmUgd2FzIGEgcmVhbCBwYXltZW50IGNoYXJnZWQgdG8gdGhlIHVzZXIqKjpcblxuICAgICAgICBTdWJqZWN0OiBcIiR7c3ViamVjdH1cIlxuICAgICAgICBGcm9tOiBcIiR7ZnJvbX1cIlxuICAgICAgICBCb2R5OlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHtib2R5VGV4dC5zbGljZSgwLCAzMDAwKX1cbiAgICAgICAgXCJcIlwiXG4gICAgICBgXG5cbiAgICAgIGxldCBwYXJzZWQ6IGFueSA9IHt9XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb21wbGV0aW9uID0gYXdhaXQgb3BlbmFpLmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgICBtb2RlbDogXCJncHQtMy41LXR1cmJvXCIsXG4gICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogXCJZb3UgYXJlIGEgYmlsbGluZyBlbWFpbCBwYXJzZXIuXCIgfSxcbiAgICAgICAgICAgIHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IHByb21wdCB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMixcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBqc29uU3RyID0gY29tcGxldGlvbi5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudCB8fCBcInt9XCJcbiAgICAgICAgY29uc3QgY2xlYW4gPSBqc29uU3RyLnJlcGxhY2UoL2BgYGpzb258YGBgL2csIFwiXCIpLnRyaW0oKVxuICAgICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKGNsZWFuKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCLinYwgT3BlbkFJIHBhcnNpbmcgZmFpbGVkOlwiLCBlcnIpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGxldCBmYWxsYmFja0Ftb3VudCA9IHBhcnNlZC5hbW91bnRcbiAgICAgIGxldCBmYWxsYmFja0N1cnJlbmN5ID0gcGFyc2VkLmN1cnJlbmN5XG5cbiAgICAgIGlmIChmYWxsYmFja0Ftb3VudCA9PSBudWxsIHx8IGZhbGxiYWNrQ3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IGJvZHlUZXh0Lm1hdGNoKC8oPzpcXCR8VVNEfENBRHxkb2xsYXJzPylcXHMqKFswLTldKyg/OlxcLlswLTldezJ9KT8pL2kpXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGZhbGxiYWNrQW1vdW50ID0gcGFyc2VGbG9hdChtYXRjaFsxXSlcbiAgICAgICAgICBmYWxsYmFja0N1cnJlbmN5ID0gbWF0Y2hbMF0uaW5jbHVkZXMoXCJVU0RcIikgPyBcIlVTRFwiIDogbWF0Y2hbMF0uaW5jbHVkZXMoXCJDQURcIikgPyBcIkNBRFwiIDogXCIkXCJcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaW5hbEFtb3VudCA9IGZhbGxiYWNrQW1vdW50ID8/IG51bGxcbiAgICAgIGNvbnN0IGZpbmFsQ3VycmVuY3kgPSBmYWxsYmFja0N1cnJlbmN5ID8/IG51bGxcblxuICAgICAgaWYgKGZpbmFsQW1vdW50ICE9PSBudWxsICYmIGZpbmFsQ3VycmVuY3kgIT09IG51bGwpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBzdWJqZWN0LFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgZGF0ZSxcbiAgICAgICAgICB2ZW5kb3JfbmFtZTogcGFyc2VkLnZlbmRvcl9uYW1lLFxuICAgICAgICAgIGFtb3VudDogZmluYWxBbW91bnQsXG4gICAgICAgICAgY3VycmVuY3k6IGZpbmFsQ3VycmVuY3ksXG4gICAgICAgICAgYmlsbGluZ19pbnRlcnZhbDogcGFyc2VkLmJpbGxpbmdfaW50ZXJ2YWwsXG4gICAgICAgICAgaXNfc3Vic2NyaXB0aW9uOiBwYXJzZWQuaXNfc3Vic2NyaXB0aW9uLFxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IGluc2VydEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKFwic3Vic2NyaXB0aW9uc1wiKS5pbnNlcnQoe1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICBzZXJ2aWNlX25hbWU6IHBhcnNlZC52ZW5kb3JfbmFtZSB8fCBcIlVua25vd25cIixcbiAgICAgICAgICBhbW91bnQ6IGZpbmFsQW1vdW50LFxuICAgICAgICAgIGN1cnJlbmN5OiBmaW5hbEN1cnJlbmN5LFxuICAgICAgICAgIGJpbGxpbmdfaW50ZXJ2YWw6IHBhcnNlZC5iaWxsaW5nX2ludGVydmFsIHx8IFwib25lLXRpbWVcIixcbiAgICAgICAgICBsYXN0X3NlZW5fZW1haWxfaWQ6IG1zZy5pZCEsXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKGluc2VydEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIuKdjCBTdXBhYmFzZSBpbnNlcnQgZXJyb3I6XCIsIGluc2VydEVycm9yKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwi4p2MIEVycm9yIHBhcnNpbmcgbWVzc2FnZTpcIiwgZXJyKVxuICAgICAgcmVzdWx0cy5wdXNoKHsgZXJyb3I6IFwiRmFpbGVkIHRvIHBhcnNlXCIsIGlkOiBtc2cuaWQgfSlcbiAgICB9XG4gIH1cblxuICBjb25zb2xlLnRpbWVFbmQoXCIvYXBpL2dtYWlsL3NjYW4gZHVyYXRpb25cIilcblxuICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBtZXNzYWdlOiBcIk5vIHJlY29yZHMgZm91bmRcIiwgbWVzc2FnZXM6IFtdIH0sIHsgc3RhdHVzOiAyMDAgfSlcbiAgfVxuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG1lc3NhZ2VzOiByZXN1bHRzIH0sIHsgc3RhdHVzOiAyMDAgfSlcbn0iXSwibmFtZXMiOlsiZ29vZ2xlIiwiTmV4dFJlc3BvbnNlIiwiZ2V0VG9rZW4iLCJKU0RPTSIsIm9wZW5haSIsInN1cGFiYXNlIiwiR0VUIiwicmVxIiwiY29uc29sZSIsImxvZyIsInRpbWUiLCJ0b2tlbiIsImFjY2Vzc1Rva2VuIiwic3ViIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwiZW1haWwiLCJkYXRhIiwidXNlclJlY29yZCIsInVzZXJFcnIiLCJmcm9tIiwic2VsZWN0IiwiZXEiLCJtYXliZVNpbmdsZSIsInVzZXJJZCIsImlkIiwib2F1dGgyQ2xpZW50IiwiYXV0aCIsIk9BdXRoMiIsInNldENyZWRlbnRpYWxzIiwiYWNjZXNzX3Rva2VuIiwicmVmcmVzaF90b2tlbiIsInJlZnJlc2hUb2tlbiIsIm1lc3NhZ2VzIiwiZ21haWwiLCJ2ZXJzaW9uIiwicmVzIiwidXNlcnMiLCJsaXN0IiwicSIsIm1heFJlc3VsdHMiLCJlcnIiLCJsZW5ndGgiLCJyZXN1bHRzIiwiZXh0cmFjdEJvZHlUZXh0IiwicGF5bG9hZCIsImZpbmRQYXJ0IiwicGFydCIsIm1pbWVUeXBlIiwiYm9keSIsImRlY29kZWQiLCJCdWZmZXIiLCJ0b1N0cmluZyIsImRvbSIsInRleHRDb250ZW50Iiwid2luZG93IiwiZG9jdW1lbnQiLCJ0ZFZhbHVlcyIsIkFycmF5IiwicXVlcnlTZWxlY3RvckFsbCIsIm1hcCIsImVsIiwidHJpbSIsImZpbHRlciIsIkJvb2xlYW4iLCJqb2luIiwiaXNBcnJheSIsInBhcnRzIiwiY2hpbGQiLCJmb3VuZCIsIm1zZyIsIm1zZ0RhdGEiLCJnZXQiLCJmb3JtYXQiLCJoZWFkZXJzIiwic3ViamVjdCIsImZpbmQiLCJoIiwibmFtZSIsInZhbHVlIiwiZGF0ZSIsImJvZHlUZXh0IiwiY3VycmVuY3lNYXRjaCIsIm1hdGNoIiwiaXNSZWNlaXB0IiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsImxvd2VyQm9keSIsInByb21wdCIsInNsaWNlIiwicGFyc2VkIiwiY29tcGxldGlvbiIsImNoYXQiLCJjb21wbGV0aW9ucyIsImNyZWF0ZSIsIm1vZGVsIiwicm9sZSIsImNvbnRlbnQiLCJ0ZW1wZXJhdHVyZSIsImpzb25TdHIiLCJjaG9pY2VzIiwibWVzc2FnZSIsImNsZWFuIiwicmVwbGFjZSIsIkpTT04iLCJwYXJzZSIsImZhbGxiYWNrQW1vdW50IiwiYW1vdW50IiwiZmFsbGJhY2tDdXJyZW5jeSIsImN1cnJlbmN5IiwicGFyc2VGbG9hdCIsImZpbmFsQW1vdW50IiwiZmluYWxDdXJyZW5jeSIsInB1c2giLCJ2ZW5kb3JfbmFtZSIsImJpbGxpbmdfaW50ZXJ2YWwiLCJpc19zdWJzY3JpcHRpb24iLCJpbnNlcnRFcnJvciIsImluc2VydCIsInVzZXJfaWQiLCJzZXJ2aWNlX25hbWUiLCJsYXN0X3NlZW5fZW1haWxfaWQiLCJ0aW1lRW5kIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/gmail/scan/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/openaiClient.ts":
/*!*****************************!*\
  !*** ./lib/openaiClient.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   openai: () => (/* binding */ openai)\n/* harmony export */ });\n/* harmony import */ var openai__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! openai */ \"(rsc)/./node_modules/.pnpm/openai@4.93.0_ws@8.18.1_zod@3.24.2/node_modules/openai/index.mjs\");\n\nconst openai = new openai__WEBPACK_IMPORTED_MODULE_0__[\"default\"]({\n    apiKey: process.env.OPENAI_API_KEY\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvb3BlbmFpQ2xpZW50LnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQTJCO0FBRXBCLE1BQU1DLFNBQVMsSUFBSUQsOENBQU1BLENBQUM7SUFDL0JFLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsY0FBYztBQUNwQyxHQUFFIiwic291cmNlcyI6WyIvVXNlcnMva2hpemFybWFsaWsvcmVwb3MvZW1haWwtc3Vicy9saWIvb3BlbmFpQ2xpZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSBcIm9wZW5haVwiXG5cbmV4cG9ydCBjb25zdCBvcGVuYWkgPSBuZXcgT3BlbkFJKHtcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5PUEVOQUlfQVBJX0tFWSxcbn0pXG4iXSwibmFtZXMiOlsiT3BlbkFJIiwib3BlbmFpIiwiYXBpS2V5IiwicHJvY2VzcyIsImVudiIsIk9QRU5BSV9BUElfS0VZIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/openaiClient.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabaseClient.ts":
/*!*******************************!*\
  !*** ./lib/supabaseClient.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/.pnpm/@supabase+supabase-js@2.49.4/node_modules/@supabase/supabase-js/dist/module/index.js\");\n\nconst supabaseUrl = \"https://caoivbabwqjvwmwjxprt.supabase.co\";\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhb2l2YmFid3Fqdndtd2p4cHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NzU1NDYsImV4cCI6MjA2MDE1MTU0Nn0.vb0q5iK7vGw9dP_2nfXXimMGfnAglg800RYOqTtAv2o\";\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2VDbGllbnQudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBb0Q7QUFFcEQsTUFBTUMsY0FBY0MsMENBQW9DO0FBQ3hELE1BQU1HLGtCQUFrQkgsa05BQXlDO0FBRTFELE1BQU1LLFdBQVdQLG1FQUFZQSxDQUFDQyxhQUFhSSxpQkFBZ0IiLCJzb3VyY2VzIjpbIi9Vc2Vycy9raGl6YXJtYWxpay9yZXBvcy9lbWFpbC1zdWJzL2xpYi9zdXBhYmFzZUNsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJcblxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhXG5jb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWSFcblxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpXG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50Iiwic3VwYWJhc2VVcmwiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwic3VwYWJhc2VBbm9uS2V5IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJzdXBhYmFzZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabaseClient.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_khizarmalik_repos_email_subs_app_api_gmail_scan_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/gmail/scan/route.ts */ \"(rsc)/./app/api/gmail/scan/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/gmail/scan/route\",\n        pathname: \"/api/gmail/scan\",\n        filename: \"route\",\n        bundlePath: \"app/api/gmail/scan/route\"\n    },\n    resolvedPagePath: \"/Users/khizarmalik/repos/email-subs/app/api/gmail/scan/route.ts\",\n    nextConfigOutput,\n    userland: _Users_khizarmalik_repos_email_subs_app_api_gmail_scan_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvLnBucG0vbmV4dEAxNS4yLjRfcmVhY3QtZG9tQDE5LjEuMF9yZWFjdEAxOS4xLjBfX3JlYWN0QDE5LjEuMC9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZnbWFpbCUyRnNjYW4lMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmdtYWlsJTJGc2NhbiUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmdtYWlsJTJGc2NhbiUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmtoaXphcm1hbGlrJTJGcmVwb3MlMkZlbWFpbC1zdWJzJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRmtoaXphcm1hbGlrJTJGcmVwb3MlMkZlbWFpbC1zdWJzJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNlO0FBQzVGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMva2hpemFybWFsaWsvcmVwb3MvZW1haWwtc3Vicy9hcHAvYXBpL2dtYWlsL3NjYW4vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2dtYWlsL3NjYW4vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9nbWFpbC9zY2FuXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9nbWFpbC9zY2FuL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2toaXphcm1hbGlrL3JlcG9zL2VtYWlsLXN1YnMvYXBwL2FwaS9nbWFpbC9zY2FuL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*********************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*********************************************************************************************************************************************************************************/
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

/***/ "?f105":
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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0","vendor-chunks/next-auth@4.24.11_@auth+core@0.38.0_nodemailer@6.10.1__next@15.2.4_react-dom@19.1.0_rea_8bf361c9c3c509dc8f6c14628e52f426","vendor-chunks/@babel+runtime@7.27.0","vendor-chunks/jose@4.15.9","vendor-chunks/uuid@8.3.2","vendor-chunks/@panva+hkdf@1.2.1","vendor-chunks/tr46@0.0.3","vendor-chunks/@supabase+auth-js@2.69.1","vendor-chunks/@supabase+realtime-js@2.11.2","vendor-chunks/@supabase+postgrest-js@1.19.4","vendor-chunks/@supabase+node-fetch@2.6.15","vendor-chunks/whatwg-url@5.0.0","vendor-chunks/@supabase+storage-js@2.7.1","vendor-chunks/formdata-node@4.4.1","vendor-chunks/@supabase+supabase-js@2.49.4","vendor-chunks/@supabase+functions-js@2.4.4","vendor-chunks/webidl-conversions@3.0.1","vendor-chunks/googleapis@148.0.0","vendor-chunks/openai@4.93.0_ws@8.18.1_zod@3.24.2","vendor-chunks/google-auth-library@9.15.1","vendor-chunks/uuid@9.0.1","vendor-chunks/form-data-encoder@1.7.2","vendor-chunks/googleapis-common@7.2.0","vendor-chunks/math-intrinsics@1.1.0","vendor-chunks/gaxios@6.7.1","vendor-chunks/es-errors@1.3.0","vendor-chunks/qs@6.14.0","vendor-chunks/jws@4.0.0","vendor-chunks/call-bind-apply-helpers@1.0.2","vendor-chunks/debug@4.4.0","vendor-chunks/agentkeepalive@4.6.0","vendor-chunks/json-bigint@1.0.0","vendor-chunks/google-logging-utils@0.0.2","vendor-chunks/get-proto@1.0.1","vendor-chunks/object-inspect@1.13.4","vendor-chunks/https-proxy-agent@7.0.6","vendor-chunks/has-symbols@1.1.0","vendor-chunks/gopd@1.2.0","vendor-chunks/gcp-metadata@6.1.1","vendor-chunks/function-bind@1.1.2","vendor-chunks/ecdsa-sig-formatter@1.0.11","vendor-chunks/agent-base@7.1.3","vendor-chunks/web-streams-polyfill@4.0.0-beta.3","vendor-chunks/node-fetch@2.7.0","vendor-chunks/url-template@2.0.8","vendor-chunks/side-channel@1.1.0","vendor-chunks/side-channel-weakmap@1.0.2","vendor-chunks/side-channel-map@1.0.1","vendor-chunks/side-channel-list@1.0.0","vendor-chunks/safe-buffer@5.2.1","vendor-chunks/ms@2.1.3","vendor-chunks/jwa@2.0.0","vendor-chunks/is-stream@2.0.1","vendor-chunks/humanize-ms@1.2.1","vendor-chunks/hasown@2.0.2","vendor-chunks/gtoken@7.1.0","vendor-chunks/get-intrinsic@1.3.0","vendor-chunks/extend@3.0.2","vendor-chunks/event-target-shim@5.0.1","vendor-chunks/es-object-atoms@1.1.1","vendor-chunks/es-define-property@1.0.1","vendor-chunks/dunder-proto@1.0.1","vendor-chunks/call-bound@1.0.4","vendor-chunks/buffer-equal-constant-time@1.0.1","vendor-chunks/bignumber.js@9.2.1","vendor-chunks/base64-js@1.5.1","vendor-chunks/abort-controller@3.0.0"], () => (__webpack_exec__("(rsc)/./node_modules/.pnpm/next@15.2.4_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgmail%2Fscan%2Froute&page=%2Fapi%2Fgmail%2Fscan%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgmail%2Fscan%2Froute.ts&appDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkhizarmalik%2Frepos%2Femail-subs&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();