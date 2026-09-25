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

const MUMBAI_CENTER: LatLngExpression = [
  19.076,
  72.8777,
];

type LayerKey =
  | "lst"
  | "ndvi"
  | "hvi"
  | "built";

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

  const meta =
    LAYER_META[layer];

  const {
    colorFor,
    min,
    max,
  } = useMemo(() => {
    const values = (
      data?.features ?? []
    ).map(
      (feature) =>
        (
          feature.properties as CellProperties
        ).value
    );

    if (values.length === 0) {
      return {
        colorFor: () => MUTED_INK,
        min: 0,
        max: 0,
      };
    }

    const lo = Math.min(...values);
    const hi = Math.max(...values);

    return {
      colorFor: sequentialScale(
        lo,
        hi
      ),
      min: lo,
      max: hi,
    };
  }, [data]);

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#EAF2F3",
      }}
    >
      {/* =================================================
          MAP HEADER / LAYER SWITCHER
         ================================================= */}

      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 60,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          maxWidth:
            "calc(100% - 80px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.8,
            borderRadius: 2.5,
            bgcolor:
              "rgba(255,255,255,.96)",
            backdropFilter:
              "blur(12px)",
            boxShadow:
              "0 8px 25px rgba(0,0,0,.08)",
          }}
        >
          <ThermostatRoundedIcon
            sx={{
              color: "#0B6B57",
              fontSize: 20,
            }}
          />

          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Mumbai heat intelligence
            </Typography>

            <Typography
              sx={{
                fontSize: 10,
                color: MUTED_INK,
                mt: 0.25,
              }}
            >
              {meta.label}
            </Typography>
          </Box>
        </Box>

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
          sx={{
            bgcolor:
              "rgba(255,255,255,.96)",
            backdropFilter:
              "blur(12px)",
            boxShadow:
              "0 8px 25px rgba(0,0,0,.08)",

            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 750,
              px: 1.4,
            },

            "& .Mui-selected": {
              color: "#FFFFFF !important",
              backgroundColor:
                "#087F78 !important",
            },
          }}
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
      </Box>

      {/* =================================================
          LOADING
         ================================================= */}

      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            background:
              "rgba(255,255,255,.25)",
            backdropFilter:
              "blur(2px)",
          }}
        >
          <CircularProgress
            sx={{
              color: "#087F78",
            }}
          />
        </Box>
      )}

      {/* =================================================
          BACKEND ERROR
         ================================================= */}

      {isError && (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            top: 76,
            left: 16,
            zIndex: 1000,
            borderRadius: 2,
          }}
        >
          Couldn't load the grid — is the
          backend running?
        </Alert>
      )}

      {/* =================================================
          LEAFLET MAP
         ================================================= */}

      <MapContainer
        center={MUMBAI_CENTER}
        zoom={11}
        preferCanvas
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* =================================================
            HEAT GRID
           ================================================= */}

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
                fillColor:
                  colorFor(value),
                fillOpacity: 0.78,
                color: "#FFFFFF",
                weight: 0.35,
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

              layerInstance.bindTooltip(
                `Ward ${ward_code} · cell ${cell_id}<br/>${meta.label}: ${value.toFixed(
                  2
                )}${meta.unit}`,
                {
                  sticky: true,
                }
              );

              layerInstance.on(
                "click",
                () =>
                  setSelectedCellId(
                    cell_id
                  )
              );

              layerInstance.on(
                "mouseover",
                (
                  event: LeafletMouseEvent
                ) => {
                  (
                    event.target as Path
                  ).setStyle({
                    weight: 2,
                    color: "#0B0B0B",
                  });
                }
              );

              layerInstance.on(
                "mouseout",
                (
                  event: LeafletMouseEvent
                ) => {
                  (
                    event.target as Path
                  ).setStyle({
                    weight: 0.35,
                    color: "#FFFFFF",
                  });
                }
              );
            }}
          />
        )}
      </MapContainer>

      {/* =================================================
          COLOR LEGEND
         ================================================= */}

      {data && (
        <SequentialLegend
          title={meta.label}
          unit={meta.unit}
          min={min}
          max={max}
        />
      )}

      {/* =================================================
          CELL DETAILS DRAWER
         ================================================= */}

      <Drawer
        anchor="right"
        open={
          selectedCellId !== null
        }
        onClose={() =>
          setSelectedCellId(null)
        }
      >
        <Box
          sx={{
            width: 340,
            p: 2,
          }}
        >
          {explain.isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "center",
                py: 3,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {explain.isError && (
            <Alert severity="error">
              Couldn't explain this
              cell.
            </Alert>
          )}

          {explain.data && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <ThermostatRoundedIcon
                  sx={{
                    color: "#0B6B57",
                  }}
                />

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                  }}
                >
                  Cell{" "}
                  {explain.data.cell_id}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: MUTED_INK,
                }}
              >
                Ward{" "}
                {explain.data.ward_code}
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                }}
              >
                {explain.data.lst_mean.toFixed(
                  1
                )}
                °C surface temperature (
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
                °C)
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  mb: 1,
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 0.6,
                }}
              >
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 17,
                    color: "#0B6B57",
                  }}
                />

                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                  }}
                >
                  Why is this cell hot?
                </Typography>
              </Box>

              {explain.data.drivers.map(
                (driver) => (
                  <Box
                    key={
                      driver.feature
                    }
                    sx={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius:
                          "50%",
                        bgcolor:
                          driver.direction ===
                          "warming"
                            ? DIVERGING.warming
                            : DIVERGING.cooling,
                        flexShrink: 0,
                      }}
                    />

                    <Typography variant="body2">
                      {driver.feature}:{" "}
                      {driver.shap_c >=
                      0
                        ? "+"
                        : ""}
                      {driver.shap_c.toFixed(
                        2
                      )}
                      °C (
                      {
                        driver.direction
                      }
                      )
                    </Typography>
                  </Box>
                )
              )}
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
