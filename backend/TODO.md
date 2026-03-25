# Backend Hang Debug TODO

## Current Progress
- [x] Analyzed code and identified likely mongoose.connect() hang due to URI + DB_NAME append on Atlas URI.

## Steps to Complete
1. **Kill hanging process**: Ctrl+C in the terminal running `npm start` [x]
2. **Add debug logs to src/db/index.js**: Edit to log before/after connect, success, error [x]
3. **Add debug logs to src/index.js**: Edit to log before/after .then(), in listen(), expanded catch
4. **Restart**: Run `npm start` from backend/ and share **full** terminal output
5. **Fix root cause**: Remove DB_NAME append in connectDB since Atlas URI doesn't need it
6. **Test**: Verify server starts, connects successfully
7. **Cleanup**: Remove all debug console.logs
8. **Done**: Remove this TODO.md

**Next step: Step 3 - edit src/index.js**

**Next step: Ready for Step 2 - edit src/db/index.js**
