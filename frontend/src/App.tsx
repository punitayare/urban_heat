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
  { label: "Heat map", key: "map" },
  { label: "Analytics", key: "analytics" },
  { label: "Scenario simulator", key: "scenario" },
  { label: "Copilot", key: "chat" },
  { label: "Alerts", key: "alerts" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function App() {
  const [section, setSection] = useState<SectionKey>("map");

  const currentIndex = SECTIONS.findIndex(
    (item) => item.key === section
  );

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ) => {
    setSection(SECTIONS[newValue].key);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f7f8",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "#073b3a",
          background:
            "linear-gradient(90deg, #073b3a 0%, #075b58 55%, #087f78 100%)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 72 },
            px: { xs: 1.5, md: 3 },
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              minWidth: "fit-content",
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(255,255,255,.12)",
              }}
            >
              <ThermostatRoundedIcon />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 16, md: 19 },
                  lineHeight: 1.1,
                }}
              >
                UrbanHeat AI
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  opacity: 0.72,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                Mumbai Climate Intelligence
              </Typography>
            </Box>
          </Box>

          <Tabs
            value={currentIndex}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              ml: { xs: 0, md: 4 },
              flex: 1,
              minHeight: 72,
              "& .MuiTab-root": {
                minHeight: 72,
                textTransform: "none",
                fontWeight: 600,
                color: "rgba(255,255,255,.72)",
              },
              "& .Mui-selected": {
                color: "#fff",
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 3,
              },
            }}
          >
            {SECTIONS.map((item) => (
              <Tab key={item.key} label={item.label} />
            ))}
          </Tabs>

          <Tooltip title="Alerts">
            <IconButton
              onClick={() => setSection("alerts")}
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,.08)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,.16)",
                },
              }}
            >
              <Badge color="error" variant="dot">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <SignInMenu />
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 72px)",
        }}
      >
        {section === "map" && <HeatMap />}

        {section === "analytics" && <Analytics />}

        {section === "scenario" && <Scenario />}

        {section === "chat" && <Chat />}

        {section === "alerts" && <Alerts />}
      </Box>

      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Heat map">
          <IconButton
            onClick={() => setSection("map")}
            sx={{
              width: 52,
              height: 52,
              color: "#fff",
              bgcolor: "#075b58",
              boxShadow: "0 8px 25px rgba(0,0,0,.2)",
              "&:hover": {
                bgcolor: "#064b49",
              },
            }}
          >
            <HomeRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default App;
