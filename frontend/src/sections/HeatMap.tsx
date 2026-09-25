import {
  Alert,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Paper,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
} from "@mui/material";

import {
  Search,
  Map as MapIcon,
  Layers,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Shield,
  Leaf,
  RotateCcw,
  X,
} from "@mui/icons-material";

import { useMemo, useState } from "react";

import type { Feature, Geometry } from "geojson";
import type {
  LatLngExpression,
  LeafletMouseEvent,
  Path,
} from "leaflet";

import {
  GeoJSON,
  MapContainer,
  TileLayer,
} from "react-leaflet";

import { useCityGrid, useExplainCell } from "../api/hooks";
import {
  DIVERGING,
  MUTED_INK,
  sequentialScale,
} from "../viz/color";

const MUMBAI_CENTER: LatLngExpression = [
  19.076,
  72.8777,
];

type LayerKey = "lst" | "ndvi" | "hvi" | "built";

const LAYER_META: Record<
  LayerKey,
  {
    label: string;
    unit: string;
  }
> = {
  lst: {
    label: "Surface temperature",
    unit: "°C",
  },

  ndvi: {
    label: "NDVI (vegetation)",
    unit: "",
  },

  hvi: {
    label: "Heat Vulnerability Index",
    unit: "",
  },

  built: {
    label: "Built-up fraction",
    unit: "",
  },
};

interface CellProperties {
  cell_id: number;
  ward_code: string;
  value: number;
}

export function HeatMap() {
  const [layer, setLayer] =
    useState<LayerKey>("lst");

  const [selectedCellId, setSelectedCellId] =
    useState<number | null>(null);

  const {
    data,
    isLoading,
    isError,
  } = useCityGrid(layer);

  const explain =
    useExplainCell(selectedCellId);

  const meta = LAYER_META[layer];

  /* =========================================================
     EXISTING DATA LOGIC
     ========================================================= */

  const {
    colorFor,
    min,
    max,
    average,
  } = useMemo(() => {
    const values = (
      data?.features ?? []
    ).map(
      (f) =>
        (f.properties as CellProperties)
          .value
    );

    if (values.length === 0) {
      return {
        colorFor: () => MUTED_INK,
        min: 0,
        max: 0,
        average: 0,
      };
    }

    const lo = Math.min(...values);
    const hi = Math.max(...values);

    const avg =
      values.reduce(
        (sum, value) => sum + value,
        0
      ) / values.length;

    return {
      colorFor: sequentialScale(lo, hi),
      min: lo,
      max: hi,
      average: avg,
    };
  }, [data]);

  const resetSelection = () => {
    setSelectedCellId(null);
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        width: "100%",
        bgcolor: "#eef5f6",
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          MAP
         ===================================================== */}

      <MapContainer
        center={MUMBAI_CENTER}
        zoom={11}
        preferCanvas
        zoomControl={true}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        {/* ===================================================
            OPEN STREET MAP
            No CARTO API key required
           =================================================== */}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* ===================================================
            EXISTING GEOJSON DATA
           =================================================== */}

        {data && (
          <GeoJSON
            key={layer}
            data={data}
            style={(feature) => {
              const value =
                (
                  feature?.properties as
                    | CellProperties
                    | undefined
                )?.value ?? min;

              return {
                fillColor: colorFor(value),
                fillOpacity: 0.72,
                color: "#ffffff",
                weight: 0.45,
              };
            }}
            onEachFeature={(
              feature: Feature<
                Geometry,
                CellProperties
              >,
              layerInstance
            ) => {
              const {
                cell_id,
                ward_code,
                value,
              } = feature.properties;

              /* Existing tooltip */
              layerInstance.bindTooltip(
                `
                <strong>Ward ${ward_code}</strong>
                <br/>
                Cell ${cell_id}
                <br/>
                ${meta.label}: ${value.toFixed(
                  2
                )}${meta.unit}
                `,
                {
                  sticky: true,
                }
              );

              /* Existing click */
              layerInstance.on(
                "click",
                () =>
                  setSelectedCellId(cell_id)
              );

              /* Existing hover */
              layerInstance.on(
                "mouseover",
                (e: LeafletMouseEvent) => {
                  (
                    e.target as Path
                  ).setStyle({
                    weight: 2,
                    color: "#073B3A",
                  });
                }
              );

              layerInstance.on(
                "mouseout",
                (e: LeafletMouseEvent) => {
                  (
                    e.target as Path
                  ).setStyle({
                    weight: 0.45,
                    color: "#ffffff",
                  });
                }
              );
            }}
          />
        )}
      </MapContainer>

      {/* =====================================================
          SEARCH BAR
         ===================================================== */}

      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          top: 20,
          left: {
            xs: 15,
            md: 25,
          },
          zIndex: 1000,
          width: {
            xs: 250,
            sm: 360,
            md: 420,
          },
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1.4,
            gap: 1,
          }}
        >
          <Search
            sx={{
              color: "#648184",
            }}
          />

          <Typography
            sx={{
              color: "#718789",
              fontSize: 14,
            }}
          >
            Search location in Mumbai...
          </Typography>
        </Box>
      </Paper>

      {/* =====================================================
          LAYER SWITCHER
         ===================================================== */}

      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          top: 92,
          left: {
            xs: 15,
            md: 25,
          },
          zIndex: 1000,
          borderRadius: 3,
          p: 1,
          bgcolor: "rgba(255,255,255,0.96)",
        }}
      >
        <ToggleButtonGroup
          value={layer}
          exclusive
          onChange={(
            _,
            value: LayerKey | null
          ) => {
            if (value) {
              setLayer(value);
            }
          }}
          size="small"
        >
          <ToggleButton value="lst">
            LST
          </ToggleButton>

          <ToggleButton value="ndvi">
            NDVI
          </ToggleButton>

          <ToggleButton value="hvi">
            HVI
          </ToggleButton>

          <ToggleButton value="built">
            Built
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* =====================================================
          LEFT INFORMATION PANEL
         ===================================================== */}

      <Paper
        elevation={5}
        sx={{
          position: "absolute",
          top: 20,
          bottom: 20,
          left: {
            xs: 15,
            md: 25,
          },
          zIndex: 900,
          width: {
            xs: 290,
            md: 305,
          },
          mt: 120 / 8,
          borderRadius: 3,
          p: 2,
          overflowY: "auto",
          bgcolor: "rgba(255,255,255,0.97)",
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <Typography
          sx={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "#132D35",
            mb: 0.5,
          }}
        >
          Urban Heat Overview
        </Typography>

        <Typography
          sx={{
            color: "#718789",
            fontSize: 12,
            mb: 2,
          }}
        >
          Mumbai spatial heat intelligence
        </Typography>

        {/* Date */}
        <InfoRow
          icon="calendar"
          label="Date"
          value="Latest available data"
        />

        {/* City */}
        <InfoRow
          icon="location"
          label="City"
          value="Mumbai"
        />

        <Box sx={{ mt: 1.5, mb: 2 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: "#28464C",
              mb: 0.8,
            }}
          >
            Active layer
          </Typography>

          <Box
            sx={{
              border: "1px solid #d9e5e5",
              borderRadius: 2,
              px: 1.4,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#fbfdfd",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Layers
                sx={{
                  fontSize: 18,
                  color: "#087F78",
                }}
              />

              <Typography
                sx={{
                  fontSize: 13,
                  color: "#344F54",
                }}
              >
                {meta.label}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ===================================================
            METRICS
           =================================================== */}

        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: "#28464C",
            mb: 1,
          }}
        >
          {meta.label}
          {meta.unit
            ? ` (${meta.unit})`
            : ""}
        </Typography>

        <MetricRow
          icon={
            <Thermometer
              sx={{
                fontSize: 20,
                color: "#F05A47",
              }}
            />
          }
          label="Average"
          value={`${average.toFixed(2)}${meta.unit}`}
        />

        <MetricRow
          icon={
            <TrendingUp
              sx={{
                fontSize: 20,
                color: "#E84E43",
              }}
            />
          }
          label="Maximum"
          value={`${max.toFixed(2)}${meta.unit}`}
        />

        <MetricRow
          icon={
            <TrendingDown
              sx={{
                fontSize: 20,
                color: "#1AA98A",
              }}
            />
          }
          label="Minimum"
          value={`${min.toFixed(2)}${meta.unit}`}
        />

        <MetricRow
          icon={
            <Shield
              sx={{
                fontSize: 20,
                color: "#F4A62A",
              }}
            />
          }
          label="Grid cells"
          value={`${data?.features.length ?? 0}`}
        />

        {/* ===================================================
            LEGEND
           =================================================== */}

        <Divider sx={{ my: 2 }} />

        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: "#28464C",
            mb: 1,
          }}
        >
          Temperature scale
        </Typography>

        <Box
          sx={{
            height: 12,
            borderRadius: 10,
            background:
              "linear-gradient(90deg, #1c9ee8 0%, #29c8a2 25%, #dce93b 50%, #ffad38 75%, #ef3340 100%)",
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 0.7,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#718789" }}
          >
            {min.toFixed(1)}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "#718789" }}
          >
            {max.toFixed(1)}
          </Typography>
        </Box>

        {/* ===================================================
            FILTERS
           =================================================== */}

        <Divider sx={{ my: 2 }} />

        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: "#28464C",
            mb: 1,
          }}
        >
          Quick filters
        </Typography>

        <FilterRow
          color="#ef3340"
          label="High heat"
        />

        <FilterRow
          color="#ffad38"
          label="Moderate heat"
        />

        <FilterRow
          color="#29c8a2"
          label="Lower heat"
        />

        <Box
          sx={{
            mt: 2,
            border: "1px solid #d9e5e5",
            borderRadius: 2,
            px: 1.2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.8,
            cursor: "pointer",
            "&:hover": {
              bgcolor: "#f2f8f7",
            },
          }}
        >
          <RotateCcw
            sx={{
              fontSize: 17,
              color: "#087F78",
            }}
          />

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "#35565A",
            }}
          >
            Reset filters
          </Typography>
        </Box>
      </Paper>

      {/* =====================================================
          RIGHT INSIGHTS PANEL
         ===================================================== */}

      <Box
        sx={{
          position: "absolute",
          top: 20,
          right: {
            xs: 15,
            md: 25,
          },
          bottom: 20,
          zIndex: 900,
          width: {
            xs: 290,
            md: 350,
          },
          display: {
            xs: "none",
            lg: "flex",
          },
          flexDirection: "column",
          gap: 2,
          pointerEvents: "none",
        }}
      >
        <Paper
          elevation={5}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.97)",
            pointerEvents: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Leaf
                sx={{
                  color: "#087F78",
                }}
              />

              <Typography
                sx={{
                  fontWeight: 800,
                  color: "#18343B",
                }}
              >
                Key insights
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 12,
                color: "#087F78",
                fontWeight: 700,
              }}
            >
              Live
            </Typography>
          </Box>

          <InsightRow
            title="Heat distribution"
            description={`${data?.features.length ?? 0} grid cells currently visible`}
            icon="🔥"
          />

          <InsightRow
            title="Maximum observed"
            description={`${max.toFixed(2)}${meta.unit}`}
            icon="🌡"
          />

          <InsightRow
            title="Minimum observed"
            description={`${min.toFixed(2)}${meta.unit}`}
            icon="🌿"
          />
        </Paper>

        {/* Copilot card */}
        <Paper
          elevation={5}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.97)",
            pointerEvents: "auto",
            mt: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 35,
                height: 35,
                borderRadius: "50%",
                bgcolor: "#E4F5F1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#087F78",
                fontWeight: 800,
              }}
            >
              AI
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#18343B",
                }}
              >
                UrbanHeat Copilot
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#1BA57E",
                }}
              >
                ● Online
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              color: "#718789",
              fontSize: 12,
              lineHeight: 1.5,
              mb: 1.5,
            }}
          >
            Ask about hotspots, drivers,
            weather, interventions or what
            the model can explain.
          </Typography>

          <Box
            sx={{
              border: "1px solid #d9e5e5",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              color: "#8CA0A2",
              fontSize: 12,
            }}
          >
            Ask your question in Copilot →
          </Box>
        </Paper>
      </Box>

      {/* =====================================================
          LOADING
         ===================================================== */}

      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            background:
              "rgba(255,255,255,0.35)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Paper
            elevation={5}
            sx={{
              px: 3,
              py: 2,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress
              size={22}
              sx={{
                color: "#087F78",
              }}
            />

            <Typography
              sx={{
                fontSize: 13,
                color: "#34555A",
              }}
            >
              Loading Mumbai heat grid...
            </Typography>
          </Paper>
        </Box>
      )}

      {/* =====================================================
          ERROR
         ===================================================== */}

      {isError && (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
            borderRadius: 3,
            boxShadow: 4,
          }}
        >
          Couldn't load the grid — is the backend
          running?
        </Alert>
      )}

      {/* =====================================================
          BOTTOM STATUS BAR
         ===================================================== */}

      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 800,
          px: 2,
          py: 0.8,
          borderRadius: 3,
          display: {
            xs: "none",
            md: "flex",
          },
          alignItems: "center",
          gap: 1.5,
          bgcolor: "rgba(255,255,255,0.94)",
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "#20B486",
          }}
        />

        <Typography
          sx={{
            fontSize: 11,
            color: "#526C70",
          }}
        >
          UrbanHeat AI
        </Typography>

        <Typography
          sx={{
            color: "#B7C5C6",
          }}
        >
          |
        </Typography>

        <Typography
          sx={{
            fontSize: 11,
            color: "#526C70",
          }}
        >
          Mumbai Urban Heat Governance
        </Typography>

        <Typography
          sx={{
            color: "#B7C5C6",
          }}
        >
          |
        </Typography>

        <Typography
          sx={{
            fontSize: 11,
            color: "#087F78",
            fontWeight: 600,
          }}
        >
          Live grid
        </Typography>
      </Paper>

      {/* =====================================================
          EXISTING CELL EXPLANATION DRAWER
         ===================================================== */}

      <Drawer
        anchor="right"
        open={selectedCellId !== null}
        onClose={resetSelection}
      >
        <Box
          sx={{
            width: {
              xs: "90vw",
              sm: 380,
            },
            height: "100%",
            bgcolor: "#f7fbfb",
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor:
                "linear-gradient(135deg, #073B3A, #087F78)",
              background:
                "linear-gradient(135deg, #073B3A, #087F78)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                Cell explanation
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  color:
                    "rgba(255,255,255,0.7)",
                }}
              >
                AI-assisted heat driver analysis
              </Typography>
            </Box>

            <IconButton
              onClick={resetSelection}
              sx={{
                color: "#ffffff",
              }}
            >
              <X />
            </IconButton>
          </Box>

          <Box sx={{ p: 2 }}>
            {explain.isLoading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 4,
                }}
              >
                <CircularProgress
                  sx={{
                    color: "#087F78",
                  }}
                />
              </Box>
            )}

            {explain.isError && (
              <Alert severity="error">
                Couldn't explain this cell.
              </Alert>
            )}

            {explain.data && (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "#17353B",
                  }}
                >
                  Cell {explain.data.cell_id}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: MUTED_INK,
                  }}
                >
                  Ward {explain.data.ward_code}
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#ffffff",
                    border:
                      "1px solid #dce9e8",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#6B8184",
                    }}
                  >
                    Surface temperature
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 30,
                      fontWeight: 850,
                      color: "#18343B",
                    }}
                  >
                    {explain.data.lst_mean.toFixed(
                      1
                    )}
                    °C
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 12,
                      color:
                        explain.data
                          .deviation >= 0
                          ? "#E24B40"
                          : "#159B7A",
                    }}
                  >
                    {explain.data.deviation >=
                    0
                      ? "+"
                      : ""}
                    {explain.data.deviation.toFixed(
                      1
                    )}
                    °C vs city mean{" "}
                    {explain.data.city_mean.toFixed(
                      1
                    )}
                    °C
                  </Typography>
                </Paper>

                <Typography
                  variant="subtitle2"
                  sx={{
                    mt: 3,
                    mb: 1,
                    fontWeight: 800,
                    color: "#18343B",
                  }}
                >
                  Why is this cell hot?
                </Typography>

                {explain.data.drivers.map(
                  (d) => (
                    <Paper
                      key={d.feature}
                      elevation={0}
                      sx={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 1.2,
                        mt: 1,
                        p: 1.3,
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        border:
                          "1px solid #e0ebea",
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius:
                            "50%",
                          bgcolor:
                            d.direction ===
                            "warming"
                              ? DIVERGING.warming
                              : DIVERGING.cooling,
                          flexShrink: 0,
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#405B60",
                        }}
                      >
                        {d.feature}:{" "}
                        {d.shap_c >= 0
                          ? "+"
                          : ""}
                        {d.shap_c.toFixed(
                          2
                        )}
                        °C (
                        {d.direction})
                      </Typography>
                    </Paper>
                  )
                )}
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

/* ============================================================
   SMALL UI COMPONENTS
   ============================================================ */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: "calendar" | "location";
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.2,
        alignItems: "center",
        mb: 1.4,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 2,
          bgcolor: "#EAF5F3",
          color: "#087F78",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
        }}
      >
        {icon === "calendar"
          ? "▣"
          : "⌖"}
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: 11,
            color: "#829497",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: "#29474C",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        mb: 1.2,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          bgcolor: "#F4F8F8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: 11,
            color: "#829497",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 800,
            color: "#17353B",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function FilterRow({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "3px",
          bgcolor: color,
        }}
      />

      <Typography
        sx={{
          fontSize: 12,
          color: "#526B70",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function InsightRow({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.2,
        py: 1.3,
        borderTop:
          "1px solid #edf2f2",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          bgcolor: "#EDF7F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#203E44",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontSize: 11,
            color: "#718789",
            mt: 0.2,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}
