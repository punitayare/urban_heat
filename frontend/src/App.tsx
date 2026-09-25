import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ThermostatRoundedIcon from "@mui/icons-material/ThermostatRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

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
  },
  {
    label: "Analytics",
    key: "analytics",
  },
  {
    label: "Scenario simulator",
    key: "scenario",
  },
  {
    label: "Copilot",
    key: "chat",
  },
  {
    label: "Alerts",
    key: "alerts",
  },
] as const;

type SectionKey =
  (typeof SECTIONS)[number]["key"];

function App() {
  const [section, setSection] =
    useState<SectionKey>("map");

  return (
    <Box
      className="app-shell"
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#F4F8F9",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background:
            "linear-gradient(90deg, #073B3A 0%, #075C59 55%, #087F78 100%)",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <Toolbar
          className="app-toolbar"
          sx={{
            minHeight: "80px !important",
            height: 80,
            px: {
              xs: 2,
              md: 3,
            },
            gap: 2,
          }}
        >
          {/* BRAND */}
          <Box
            className="brand"
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
              flexShrink: 0,
            }}
          >
            <Box
              className="brand-mark"
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid #35D7A5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThermostatRoundedIcon
                sx={{
                  color: "#35D7A5",
                  fontSize: 25,
                }}
              />
            </Box>

            <Box>
              <Typography
                className="brand-name"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: {
                    xs: "1.05rem",
                    md: "1.35rem",
                  },
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                UrbanHeat <span>AI</span>
              </Typography>

              <Typography
                className="brand-subtitle"
                sx={{
                  color:
                    "rgba(255,255,255,0.68)",
                  fontSize: {
                    xs: 10,
                    md: 12,
                  },
                  mt: 0.35,
                }}
              >
                Mumbai climate intelligence
              </Typography>
            </Box>
          </Box>

          {/* NAVIGATION */}
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
                  "rgba(255,255,255,0.75)",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
              },

              "& .MuiTab-root:hover": {
                color: "#FFFFFF",
                background:
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
                label={item.label}
              />
            ))}
          </Tabs>

          <Box sx={{ flex: 1 }} />

          {/* ALERT BUTTON */}
          <Tooltip title="Monitoring alerts">
            <IconButton
              onClick={() =>
                setSection("alerts")
              }
              sx={{
                color: "#FFFFFF",
                display: {
                  xs: "none",
                  sm: "inline-flex",
                },
              }}
            >
              <Badge
                color="warning"
                variant="dot"
              >
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* SIGN IN */}
          <SignInMenu />
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <Box
        className="app-content"
        sx={{
          flex: 1,
          minHeight: 0,
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

      {/* MOBILE HOME */}
      <Box
        className="mobile-home"
        onClick={() => setSection("map")}
        sx={{
          display: {
            xs: "none",
            sm: "none",
          },
        }}
      >
        <HomeRoundedIcon fontSize="small" />

        <Typography variant="caption">
          Home
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
