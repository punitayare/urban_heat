import {
  AppBar,
  Box,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { SignInMenu } from "./auth/SignInMenu";
import { Alerts } from "./sections/Alerts";
import { Analytics } from "./sections/Analytics";
import { Chat } from "./sections/Chat";
import { HeatMap } from "./sections/HeatMap";
import { Scenario } from "./sections/Scenario";

const SECTIONS = [
  { label: "Heat map", key: "map" },
  { label: "Analytics", key: "analytics" },
  { label: "Scenario simulator", key: "scenario" },
  { label: "Copilot", key: "chat" },
  { label: "Alerts", key: "alerts" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function App() {
  const [section, setSection] = useState<SectionKey>("map");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "#f4f8f8",
      }}
    >
      {/* =========================================================
          TOP NAVIGATION
         ========================================================= */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background:
            "linear-gradient(135deg, #073B3A 0%, #075B59 55%, #087F78 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "78px !important",
            px: {
              xs: 2,
              md: 3,
            },
            gap: 2,
          }}
        >
          {/* Brand */}
          <Box
            onClick={() => setSection("map")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.4,
              cursor: "pointer",
              minWidth: {
                xs: 150,
                md: 245,
              },
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "2px solid #36D7A7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#36D7A7",
                fontSize: 23,
                fontWeight: 800,
              }}
            >
              ◇
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: {
                    xs: "1.05rem",
                    md: "1.3rem",
                  },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                UrbanHeat AI
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.68)",
                  fontSize: "0.72rem",
                  mt: 0.35,
                  display: {
                    xs: "none",
                    md: "block",
                  },
                }}
              >
                Smarter Cities. Cooler Futures.
              </Typography>
            </Box>
          </Box>

          {/* Navigation */}
          <Tabs
            value={section}
            onChange={(_, value: SectionKey) => setSection(value)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              minHeight: 52,

              "& .MuiTabs-flexContainer": {
                gap: 0.5,
              },

              "& .MuiTab-root": {
                minHeight: 52,
                px: {
                  xs: 1.4,
                  md: 2,
                },
                borderRadius: "7px",
                color: "rgba(255,255,255,0.72)",
                fontWeight: 600,
                fontSize: "0.88rem",
                textTransform: "none",
                transition: "all 0.2s ease",
              },

              "& .MuiTab-root:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.08)",
              },

              "& .Mui-selected": {
                color: "#ffffff !important",
                background:
                  "linear-gradient(135deg, #13A98E 0%, #087F78 100%)",
              },

              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            {SECTIONS.map((s) => (
              <Tab
                key={s.key}
                value={s.key}
                label={s.label}
              />
            ))}
          </Tabs>

          <Box sx={{ flex: 1 }} />

          <SignInMenu />
        </Toolbar>
      </AppBar>

      {/* =========================================================
          PAGE CONTENT
         ========================================================= */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {section === "map" && <HeatMap />}
        {section === "analytics" && <Analytics />}
        {section === "scenario" && <Scenario />}
        {section === "chat" && <Chat />}
        {section === "alerts" && <Alerts />}
      </Box>
    </Box>
  );
}

export default App;
