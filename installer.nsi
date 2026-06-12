; YouTube Spy — NSIS One-Click Installer (style electron-builder)
!define APP_NAME      "YouTube Spy"
!define APP_VERSION   "2026.05.48"
!define APP_EXE       "YouTube Spy.exe"
!define INSTALL_DIR   "$APPDATA\YouTube Spy"
!define PUBLISHER     "Bá Phương"

!include "MUI2.nsh"

; ── Cấu hình chung ────────────────────────────────────────────────────────────
Name "${APP_NAME}"
OutFile "dist\YouTube Spy Setup 2026.05.48.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel user
SetCompressor /SOLID lzma
ShowInstDetails nevershow
BrandingText "YouTube Spy ${APP_VERSION}  ·  © 2026 Bá Phương"

; ── MUI2 appearance ───────────────────────────────────────────────────────────
!define MUI_ICON                        "Logo_build.ico"
!define MUI_UNICON                      "Logo_build.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP          "installer_header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_BGCOLOR                     "0F0F1A"
!define MUI_INSTFILESPAGE_COLORS        "A78BFA 0F0F1A"

; Không dùng finish page — auto close


; Auto-close InstFiles sau khi xong
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE   InstDone
Function InstDone
  SetAutoClose true
FunctionEnd

; ── Pages ─────────────────────────────────────────────────────────────────────
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Vietnamese"

; ── Strings hiển thị tiếng Việt ───────────────────────────────────────────────
LangString MUI_TEXT_INSTALLING_TITLE    ${LANG_VIETNAMESE} "Đang cài đặt YouTube Spy"
LangString MUI_TEXT_INSTALLING_SUBTITLE ${LANG_VIETNAMESE} "Vui lòng chờ trong giây lát..."
LangString MUI_TEXT_FINISH_TITLE        ${LANG_VIETNAMESE} "Cài đặt hoàn tất"
LangString MUI_TEXT_FINISH_SUBTITLE     ${LANG_VIETNAMESE} "YouTube Spy đã sẵn sàng sử dụng."

; ── Install ───────────────────────────────────────────────────────────────────
Section
  SetOutPath "$INSTDIR"
  File /r "dist\onedir\YouTube Spy\*.*"

  CreateShortcut "$DESKTOP\${APP_NAME}.lnk"       "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}"
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"   "$INSTDIR\${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Gỡ cài đặt.lnk"   "$INSTDIR\Uninstall.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName"    "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher"      "${PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon"    "$INSTDIR\${APP_EXE}"

  ; Tự mở app sau khi cài
  Exec '"$INSTDIR\${APP_EXE}"'
SectionEnd

; ── Uninstall ─────────────────────────────────────────────────────────────────
Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd
