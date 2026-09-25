import {
  Alert,
  Box,
  CircularProgress,
  Drawer,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { useMemo, useState } from "react";

import type {
  Feature,
  Geometry,
} from "geojson";

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

import ThermostatRoundedIcon from "@mui/icons-material/ThermostatRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  useCityGrid,
  useExplainCell,
} from "../api/hooks";

import {
  DIVERGING,
  MUTED_INK,
  sequentialScale,
} from "../viz/color";

import { SequentialLegend } from "../viz/SequentialLegend";

const MUMBAI_CENTER: LatLngExpression = [19.076, 72.8777];

type LayerKey = "lst" | "ndvi" | "hvi" | "built";

const LAYER_META: Record<
  LayerKey,
  {
    label: string;
    shortLabel: string;
    unit: string;
  }
> = {
  lst: {
    label: "Land Surface Temperature",
    shortLabel: "LST",
    unit: "°C",
  },
  ndvi: {
    label: "Vegetation Index",
    shortLabel: "NDVI",
    unit: "",
  },
  hvi: {
    label: "Heat Vulnerability Index",
    shortLabel: "HVI",
    unit: "",
  },
  built: {
    label: "Built-up Index",
    shortLabel: "Built-up",
    unit: "",
  },
};

type CellProperties = {
  cell_id: string | number;
  ward_code?: string | null;
  value?: number | null;
};

type GridFeature = Feature<Geometry, CellProperties>;

function getValue(feature: GridFeature): number | null {
  const value = feature.properties?.value;

  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
}

export function HeatMap() {
  const [layer, setLayer] = useState<LayerKey>("lst");
  const [selectedCellId, setSelectedCellId] = useState<string | null>(
    null
  );
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(
    null
  );

  const {
    data: grid,
    isLoading,
    error,
  } = useCityGrid(layer);

  const {
    data: explanation,
    isLoading: explanationLoading,
    error: explanationError,
  } = useExplainCell(selectedCellId);

  const features = useMemo<GridFeature[]>(() => {
    if (!grid) {
      return [];
    }

    if (Array.isArray(grid)) {
      return grid as GridFeature[];
    }

    if (
      typeof grid === "object" &&
      "features" in grid &&
      Array.isArray(grid.features)
    ) {
      return grid.features as GridFeature[];
    }

    return [];
  }, [grid]);

  const values = useMemo(() => {
    return features
      .map(getValue)
      .filter((value): value is number => value !== null);
  }, [features]);

  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 1;

  const colorScale = useMemo(
    () => sequentialScale(minValue, maxValue, DIVERGING),
    [minValue, maxValue]
  );

  const selectedFeature = useMemo(() => {
    if (!selectedCellId) {
      return null;
    }

    return (
      features.find(
        (feature) =>
          String(feature.properties?.cell_id) === selectedCellId
      ) ?? null
    );
  }, [features, selectedCellId]);

  const layerStyle = (
    feature?: GridFeature
  ): {
    fillColor: string;
    fillOpacity: number;
    color: string;
    weight: number;
  } => {
    const value = feature ? getValue(feature) : null;

    if (value === null) {
      return {
        fillColor: "#94a3b8",
        fillOpacity: 0.12,
        color: "#64748b",
        weight: 0.5,
      };
    }

    return {
      fillColor: colorScale(value),
      fillOpacity:
        String(feature?.properties?.cell_id) === selectedCellId
          ? 0.85
          : String(feature?.properties?.cell_id) === hoveredCellId
            ? 0.72
            : 0.58,
      color:
        String(feature?.properties?.cell_id) === selectedCellId
          ? "#111827"
          : "#ffffff",
      weight:
        String(feature?.properties?.cell_id) === selectedCellId
          ? 2
          : 0.45,
    };
  };

  const handleEachFeature = (
    feature: GridFeature,
    layerInstance: Path
  ) => {
    const cellId = String(feature.properties?.cell_id ?? "");

    layerInstance.bindTooltip(
      `
        <div style="font-family: Inter, Arial, sans-serif; min-width: 130px;">
          <div style="font-size:11px; color:#64748b; margin-bottom:3px;">
            ${LAYER_META[layer].shortLabel}
          </div>
          <div style="font-size:16px; font-weight:700; color:#111827;">
            ${
              getValue(feature) === null
                ? "No data"
                : `${getValue(feature)?.toFixed(2)} ${
                    LAYER_META[layer].unit
                  }`
            }
          </div>
          ${
            feature.properties?.ward_code
              ? `<div style="font-size:11px; color:#64748b; margin-top:3px;">
                  Ward ${feature.properties.ward_code}
                </div>`
              : ""
          }
        </div>
      `,
      {
        sticky: true,
        direction: "top",
      }
    );

    layerInstance.on({
      mouseover: (event: LeafletMouseEvent) => {
        setHoveredCellId(cellId);

        event.target.setStyle({
          fillOpacity: 0.78,
          weight: 1.5,
        });

        event.target.bringToFront();
      },

      mouseout: (event: LeafletMouseEvent) => {
        setHoveredCellId((current) =>
          current === cellId ? null : current
        );

        event.target.setStyle(layerStyle(feature));
      },

      click: () => {
        setSelectedCellId(cellId);
      },
    });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 72px)",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f8fafc",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography color="text.secondary">
            Loading Mumbai heat grid…
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Couldn't load the grid — is the backend running?
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        height: "calc(100vh - 72px)",
        minHeight: 650,
        overflow: "hidden",
        bgcolor: "#e2e8f0",
      }}
    >
      <MapContainer
        center={MUMBAI_CENTER}
        zoom={11}
        minZoom={9}
        maxZoom={16}
        zoomControl={true}
        style={{
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {features.length > 0 && (
          <GeoJSON
            key={`${layer}-${selectedCellId ?? "none"}`}
            data={
              {
                type: "FeatureCollection",
                features,
              } as GeoJSON.FeatureCollection<
                Geometry,
                CellProperties
              >
            }
            style={(feature) =>
              layerStyle(feature as GridFeature)
            }
            onEachFeature={(
              feature,
              layerInstance
            ) =>
              handleEachFeature(
                feature as GridFeature,
                layerInstance
              )
            }
          />
        )}
      </MapContainer>

      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 500,
          width: { xs: "calc(100% - 40px)", sm: 390 },
          bgcolor: "rgba(255,255,255,.96)",
          border: "1px solid rgba(15,23,42,.08)",
          borderRadius: 3,
          boxShadow: "0 12px 35px rgba(15,23,42,.14)",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#fff1f2",
              color: "#dc2626",
            }}
          >
            <ThermostatRoundedIcon />
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 18,
                lineHeight: 1.1,
              }}
            >
              Mumbai Heat Map
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: MUTED_INK,
                mt: 0.35,
              }}
            >
              Spatial heat intelligence
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={layer}
          onChange={(_, value: LayerKey | null) => {
            if (value) {
              setLayer(value);
              setSelectedCellId(null);
            }
          }}
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12,
            },
          }}
        >
          <ToggleButton value="lst">LST</ToggleButton>
          <ToggleButton value="ndvi">NDVI</ToggleButton>
          <ToggleButton value="hvi">HVI</ToggleButton>
          <ToggleButton value="built">Built-up</ToggleButton>
        </ToggleButtonGroup>

        <Box
          sx={{
            mt: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <InfoOutlinedIcon
            sx={{
              fontSize: 17,
              color: "text.secondary",
            }}
          />

          <Typography
            sx={{
              fontSize: 11,
              color: "text.secondary",
            }}
          >
            Click any grid cell to inspect its heat drivers.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: 20,
          zIndex: 500,
          bgcolor: "rgba(255,255,255,.96)",
          border: "1px solid rgba(15,23,42,.08)",
          borderRadius: 2.5,
          boxShadow: "0 8px 25px rgba(15,23,42,.12)",
          p: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            mb: 1,
          }}
        >
          {LAYER_META[layer].label}
        </Typography>

        <SequentialLegend
          min={minValue}
          max={maxValue}
          unit={LAYER_META[layer].unit}
          colorScale={colorScale}
        />
      </Box>

      {hoveredCellId && !selectedCellId && (
        <Box
          sx={{
            position: "absolute",
            right: 20,
            bottom: 20,
            zIndex: 500,
            bgcolor: "rgba(255,255,255,.94)",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            boxShadow: "0 8px 25px rgba(15,23,42,.12)",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: "text.secondary",
            }}
          >
            Cell
          </Typography>

          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {hoveredCellId}
          </Typography>
        </Box>
      )}

      <Drawer
        anchor="right"
        open={Boolean(selectedCellId)}
        onClose={() => setSelectedCellId(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            p: 3,
          },
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Cell explanation
        </Typography>

        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 850,
            mt: 0.5,
          }}
        >
          {selectedCellId}
        </Typography>

        {selectedFeature?.properties?.ward_code && (
          <Typography
            sx={{
              color: "text.secondary",
              mt: 0.5,
            }}
          >
            Ward {selectedFeature.properties.ward_code}
          </Typography>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2.5,
            bgcolor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            {LAYER_META[layer].label}
          </Typography>

          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 850,
              mt: 0.25,
            }}
          >
            {selectedFeature &&
            getValue(selectedFeature) !== null
              ? `${getValue(selectedFeature)?.toFixed(2)} ${
                  LAYER_META[layer].unit
                }`
              : "No data"}
          </Typography>
        </Box>

        {explanationLoading && (
          <Box
            sx={{
              py: 5,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {explanationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Couldn't load the cell explanation.
          </Alert>
        )}

        {explanation && (
          <Box sx={{ mt: 3 }}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 800,
                mb: 1.5,
              }}
            >
              Heat drivers
            </Typography>

            {Array.isArray(explanation.shap_values) &&
              explanation.shap_values.map(
                (driver: any, index: number) => (
                  <Box
                    key={`${driver?.feature ?? "driver"}-${index}`}
                    sx={{
                      py: 1.5,
                      borderBottom:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {driver?.feature ??
                          driver?.name ??
                          `Driver ${index + 1}`}
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {typeof driver?.value ===
                        "number"
                          ? driver.value.toFixed(3)
                          : driver?.value ?? "—"}
                      </Typography>
                    </Box>

                    {driver?.description && (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                          mt: 0.5,
                        }}
                      >
                        {driver.description}
                      </Typography>
                    )}
                  </Box>
                )
              )}

            {explanation.summary && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 800,
                    mb: 1,
                  }}
                >
                  Explanation
                </Typography>

                <Typography
                  sx={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "text.secondary",
                  }}
                >
                  {explanation.summary}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
