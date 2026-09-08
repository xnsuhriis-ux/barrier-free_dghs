"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { X } from "lucide-react";



type MapComponentProps = {
  center: { lat: number; lng: number };
  reports: any[];
};

const CATEGORY_COLORS: Record<string, string> = {
  "점자블록 파손": "#EF4444", // 빨강
  "불법 적치물": "#EAB308", // 노랑
  "높은 턱/단차": "#3B82F6", // 파랑
  "기타": "#6B7280", // 회색
};

const CATEGORY_LABELS: Record<string, string> = {
  "점자블록 파손": "파손",
  "불법 적치물": "적치물",
  "높은 턱/단차": "단차",
  "기타": "기타",
};

function getMarkerColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS["기타"];
}

function buildMarkerImage(category: string) {
  const color = getMarkerColor(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.6 26.4 0 17 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="17" cy="17" r="6.5" fill="#ffffff"/>
  </svg>`;
  const encoded =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : "";
  return {
    src: `data:image/svg+xml;base64,${encoded}`,
    size: { width: 34, height: 44 },
    options: { offset: { x: 17, y: 44 } },
  };
}

export default function MapComponent({ center, reports }: MapComponentProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);

  // layout.tsx 에서 autoload=false 로 SDK 스크립트만 불러왔으므로,
  // 여기서 kakao.maps.load() 를 직접 호출해 지도 객체를 초기화한다.
  useEffect(() => {
    let cancelled = false;

    function waitForKakao() {
      if (cancelled) return;
      if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          if (!cancelled) setIsSdkReady(true);
        });
      } else {
        setTimeout(waitForKakao, 100);
      }
    }

    waitForKakao();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isSdkReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map center={center} style={{ width: "100%", height: "100%" }} level={4}>
        {reports.map((report) => (
          <MapMarker
            key={report.id}
            position={{ lat: report.latitude, lng: report.longitude }}
            image={buildMarkerImage(report.category)}
            title={report.category}
            onClick={() => setSelectedReport(report)}
          />
        ))}
      </Map>

      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: getMarkerColor(selectedReport.category) }}
                >
                  {CATEGORY_LABELS[selectedReport.category] || selectedReport.category}
                </span>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(selectedReport.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                aria-label="닫기"
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {selectedReport.image_url && (
              <img
                src={selectedReport.image_url}
                alt={`${selectedReport.category} 제보 사진`}
                className="mt-4 h-56 w-full rounded-xl object-cover"
              />
            )}

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {selectedReport.description || "상세 설명이 없습니다."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
