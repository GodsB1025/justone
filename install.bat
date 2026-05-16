@echo off
:: Cross-platform installer wrapper for cmd.exe.
:: Just delegates to install.mjs.
node "%~dp0install.mjs" %*
