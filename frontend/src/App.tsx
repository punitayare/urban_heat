import {
  AppBar,
  Box,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  MapOutlined,
  BarChartOutlined,
  TuneOutlined,
  ChatBubbleOutlined,
  NotificationsNoneOutlined,
  PersonOutlined,
  KeyboardArrowDown,
} from "@mui/icons-material";

import { useState } from "react";

import { SignInMenu } from "./auth/SignInMenu";
import { Alerts } from "./sections/Alerts";
import { Analytics } from "./sections/Analytics";
import { Chat } from "./sections/Chat";
import { HeatMap } from "./sections/HeatMap";
import { Scenario } from "./sections/Scenario";

const SECTIONS = [
  {
    label: "Heat map",
    key: "map",
    icon: <MapOutlined />,
  },
  {
    label: "Analytics",
    key: "analytics",
    icon: <BarChartOutlined />,
  },
  {
    label: "Scenario simulator",
    key: "scenario",
    icon: <TuneOutlined />,
  },
  {
    label: "Copilot",
    key: "chat",
    icon: <ChatBubbleOutlined />,
  },
  {
    label: "Alerts",
    key: "alerts",
    icon: <NotificationsNoneOutlined />,
  },
] as const;

type SectionKey =
  (typeof SECTIONS)[number]["key"];

function App() {
  const [section, setSection] =
    useState<SectionKey>("map");

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#F3F8F9",
      }}
    >
      {/* =====================================================
          NAVIGATION BAR
         ===================================================== */}

      <AppBar
        position="static"
        elevation={0}
        sx={{
          flexShrink: 0,
          background:
            "linear-gradient(90deg, #073B3A 0%, #075C59 55%, #087F78 100%)",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar
          sx={{
            height: 80,
            minHeight: "80px !important",
            px: {
              xs: 2,
              md: 3,
            },
            gap: 2,
          }}
        >
          {/* =================================================
              BRAND
             ================================================= */}

          <Box
            onClick={() => setSection("map")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.4,
              cursor: "pointer",
              minWidth: {
                xs: 190,
                md: 285,
              },
              userSelect: "none",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid #35D7A5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 17,
                  height: 17,
                  border: "2px solid #35D7A5",
                  transform: "rotate(45deg)",
                }}
              />
            </Box>

            {/* Brand */}
            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontSize: {
                    xs: "1.05rem",
                    md: "1.35rem",
                  },
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                UrbanHeat AI
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color:
                    "rgba(255,255,255,0.68)",
                  fontSize: {
                    xs: 10,
                    md: 12,
                  },
                  lineHeight: 1,
                }}
              >
                Smarter Cities. Cooler Futures.
              </Typography>
            </Box>
          </Box>

          {/* =================================================
              NAVIGATION TABS
             ================================================= */}

          <Tabs
            value={section}
            onChange={(_, value: SectionKey) =>
              setSection(value)
            }
            variant="scrollable"
            scrollButtons={false}
            sx={{
              minHeight: 56,

              "& .MuiTabs-flexContainer": {
                gap: 0.5,
              },

              "& .MuiTab-root": {
                minHeight: 56,
                height: 56,
                minWidth: "auto",
                px: {
                  xs: 1.5,
                  md: 2,
                },
                borderRadius: "7px",
                color:
                  "rgba(255,255,255,0.76)",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                transition:
                  "all 180ms ease",
              },

              "& .MuiTab-root:hover": {
                color: "#FFFFFF",
                backgroundColor:
                  "rgba(255,255,255,0.08)",
              },

              "& .Mui-selected": {
                color:
                  "#FFFFFF !important",
                background:
                  "linear-gradient(135deg, #11A78D 0%, #07947E 100%)",
                boxShadow:
                  "0 4px 14px rgba(0,0,0,0.12)",
              },

              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            {SECTIONS.map((item) => (
              <Tab
                key={item.key}
                value={item.key}
                icon={item.icon}
                iconPosition="start"
                label={item.label}
                sx={{
                  "& .MuiSvgIcon-root": {
                    fontSize: 20,
                  },
                }}
              />
            ))}
          </Tabs>

          {/* Push user section to the right */}
          <Box sx={{ flex: 1 }} />

          {/* =================================================
              DESKTOP USER DISPLAY
             ================================================= */}

          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },
              alignItems: "center",
              gap: 1,
              mr: 0.5,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor:
                  "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <PersonOutlined
                sx={{
                  fontSize: 21,
                }}
              />
            </Box>

            <Typography
              sx={{
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Punit
            </Typography>

            <KeyboardArrowDown
              sx={{
                color:
                  "rgba(255,255,255,0.75)",
                fontSize: 19,
              }}
            />
          </Box>

          {/* =================================================
              EXISTING SIGN-IN MENU
             ================================================= */}

          <Box
            sx={{
              display: {
                xs: "block",
                md: "none",
              },
            }}
          >
            <SignInMenu />
          </Box>
        </Toolbar>
      </AppBar>

      {/* =====================================================
          MAIN CONTENT

          Existing components are kept unchanged.
         ===================================================== */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {section === "map" && (
          <HeatMap />
        )}

        {section === "analytics" && (
          <Analytics />
        )}

        {section === "scenario" && (
          <Scenario />
        )}

        {section === "chat" && (
          <Chat />
        )}

        {section === "alerts" && (
          <Alerts />
        )}
      </Box>
    </Box>
  );
}

export default App;
