'use client';

import { useState } from 'react';
import Script from 'next/script';
import { MapPin, Plus, X, Send, AlertTriangle, Map, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoadviewOpen, setIsRoadviewOpen] = useState(false);
  
  // 💡 우회로 모아보기 모드 스위치
  const [showOnlyDetours, setShowOnlyDetours] = useState(false);
  // 지도에 찍힌 핀들을 관리하기 위한 배열 (스위치 껐다 켤 때 사용)
  const [markers, setMarkers] = useState<any[]>([]); 
  const [allReports, setAllReports] = useState<any[]>([]);

  const [selectedTag, setSelectedTag] = useState('#파손된_점자블록');
  const [content, setContent] = useState('');
  const [detour, setDetour] = useState('');
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);

  const tags = ['#파손된_점자블록', '#적치물_위험', '#높은_단차', '#잘못된_유도선'];
  const kakaoAppKey = '0ff202eb90a222bcaae2e625ea42fe67';

  // 🚨 로드뷰 안에 띄우는 3D 표지판 (+ 민원 핫라인)
  const addMarkerToRoadview = (rvInstance: any, report: any) => {
    const kakao = (window as any).kakao;
    const position = new kakao.maps.LatLng(report.lat, report.lng);
    let icon = report.tag === '#파손된_점자블록' ? '🦮' : report.tag === '#적치물_위험' ? '🚧' : report.tag === '#높은_단차' ? '🧱' : '🛑';

    const rvOverlayContent = `
      <div class="relative flex flex-col items-center animate-bounce" style="transform: translateY(-20px);">
        <div class="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(255,0,0,0.6)] border border-red-500 flex items-center gap-1.5">
          ${icon} ${report.tag}
        </div>
        <a href="https://www.epeople.go.kr/" target="_blank" class="mt-2 bg-red-600 hover:bg-red-700 text-white text-[10px] px-3 py-1.5 rounded-md shadow-lg pointer-events-auto border border-white/20 transition-colors">
          🚨 국민신문고 즉시 민원
        </a>
        <div class="w-1 h-6 bg-red-500 mt-1"></div>
        <div class="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_red]"></div>
      </div>
    `;

    new kakao.maps.CustomOverlay({
      map: rvInstance,
      position: position,
      content: rvOverlayContent,
      yAnchor: 1
    });
  };

  // 📺 꽉 찬 전체화면 로드뷰 오픈!
  const openRoadview = (lat: number, lng: number, report: any = null) => {
    const kakao = (window as any).kakao;
    const rvContainer = document.getElementById('roadview'); 
    rvContainer!.innerHTML = ''; 
    
    const rv = new kakao.maps.Roadview(rvContainer);
    const rvClient = new kakao.maps.RoadviewClient();
    const position = new kakao.maps.LatLng(lat, lng);

    rvClient.getNearestPanoId(position, 50, (panoId: any) => {
      if (panoId === null) {
        alert('이 위치는 카카오 로드뷰가 제공되지 않는 구역입니다 ㅠㅠ 길가 쪽 핀을 눌러주세요!');
      } else {
        setIsRoadviewOpen(true); 
        rv.setPanoId(panoId, position); 
        
        if (report) {
          kakao.maps.event.addListener(rv, 'init', () => {
            addMarkerToRoadview(rv, report);
          });
        }
      }
    });
  };

  // 📍 지도에 핀 그리기 (+ 민원 버튼 추가)
  const addMarkerToMap = (mapInstance: any, report: any) => {
    const kakao = (window as any).kakao;
    const position = new kakao.maps.LatLng(report.lat, report.lng);
    let bgColor = report.tag === '#파손된_점자블록' ? '#eab308' : report.tag === '#적치물_위험' ? '#f97316' : report.tag === '#높은_단차' ? '#dc2626' : '#3b82f6';
    let icon = report.tag === '#파손된_점자블록' ? '🦮' : report.tag === '#적치물_위험' ? '🚧' : report.tag === '#높은_단차' ? '🧱' : '🛑';

    const contentNode = document.createElement('div');
    contentNode.className = 'relative flex flex-col items-center group cursor-pointer';
    
    contentNode.innerHTML = `
      <div class="text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg text-lg border-2 border-white relative z-10 hover:scale-110 transition-transform" style="background-color: ${bgColor};">${icon}</div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${bgColor}; margin-top: -2px;"></div>
      
      <div class="absolute bottom-12 hidden group-hover:block w-64 bg-white p-3 rounded-xl shadow-2xl text-sm border border-gray-100 z-50">
        <span class="font-bold text-gray-800">${report.tag}</span>
        <p class="text-gray-600 mt-1 line-clamp-2">${report.content}</p>
        
        ${report.detour ? `
          <div class="mt-2 bg-emerald-50 text-emerald-700 p-2 rounded-lg text-xs font-semibold flex items-start gap-1 border border-emerald-100">
            <span>✨</span> <span><b>안전 경로:</b> ${report.detour}</span>
          </div>
        ` : ''}
        
        <div class="mt-3 flex flex-col gap-1.5">
          <button class="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-md py-2 transition-colors flex justify-center items-center gap-1">
            <span class="text-[10px]">👀</span> 현장 로드뷰 보기
          </button>
          <a href="https://www.epeople.go.kr/" target="_blank" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-md py-1.5 transition-colors border border-red-100 text-xs text-center flex justify-center items-center gap-1">
            🚨 관할 지자체 민원 넣기
          </a>
        </div>
      </div>
    `;

    contentNode.onmousedown = (e) => e.stopPropagation();
    
    // 로드뷰 보기 버튼 클릭 이벤트 연결 (a 태그 클릭 시엔 이벤트 막기)
    const viewBtn = contentNode.querySelector('button');
    const minwonLink = contentNode.querySelector('a');
    
    viewBtn!.onclick = (e) => { e.stopPropagation(); openRoadview(report.lat, report.lng, report); };
    minwonLink!.onclick = (e) => { e.stopPropagation(); }; // 민원 링크는 새 창으로 이동

    const overlay = new kakao.maps.CustomOverlay({ map: mapInstance, position: position, content: contentNode, yAnchor: 1 });
    
    return overlay; // 배열 관리를 위해 오버레이 객체 반환
  };

  const loadExistingReports = async (mapInstance: any) => {
    const { data, error } = await supabase.from('reports').select('*');
    if (!error && data) {
      setAllReports(data);
      const newMarkers = data.map(report => addMarkerToMap(mapInstance, report));
      setMarkers(newMarkers);
    }
  };

  const initMap = () => {
    const kakao = (window as any).kakao;
    kakao.maps.load(() => {
      const container = document.getElementById('map');
      const createdMap = new kakao.maps.Map(container, { center: new kakao.maps.LatLng(37.2041, 127.0772), level: 3 });
      setMap(createdMap); setMapLoaded(true);
      loadExistingReports(createdMap);

      kakao.maps.event.addListener(createdMap, 'click', (mouseEvent: any) => {
        setClickCoords({ lat: mouseEvent.latLng.getLat(), lng: mouseEvent.latLng.getLng() });
        setIsModalOpen(true);
      });
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) return alert('불편 내용을 입력해주세요!');
    const newReport = { tag: selectedTag, content: content, detour: detour, lat: clickCoords?.lat || 37.2041, lng: clickCoords?.lng || 127.0772 };
    
    const { error } = await supabase.from('reports').insert([newReport]);
    if (error) alert(`저장 실패: ${error.message}`);
    else {
      alert('성공적으로 등록되었습니다!');
      const newMarker = addMarkerToMap(map, newReport);
      setMarkers(prev => [...prev, newMarker]);
      setAllReports(prev => [...prev, newReport]);
      setIsModalOpen(false); setContent(''); setDetour('');
    }
  };

  // 💡 안전 우회로 필터링 함수
  const toggleDetours = () => {
    const isNowDetourMode = !showOnlyDetours;
    setShowOnlyDetours(isNowDetourMode);

    // 기존 핀 싹 지우기
    markers.forEach(m => m.setMap(null));
    setMarkers([]);

    // 필터링해서 다시 그리기
    const filteredReports = isNowDetourMode ? allReports.filter(r => r.detour && r.detour.trim() !== '') : allReports;
    const newMarkers = filteredReports.map(report => addMarkerToMap(map, report));
    setMarkers(newMarkers);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-100">
      <Script src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`} onLoad={initMap} />
      
      {/* 🟢 기본 지도 도화지 (항상 전체 화면) */}
      <div id="map" className="absolute inset-0 w-full h-full z-0"></div>

      {mapLoaded && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
          <div className="bg-white px-4 py-3 rounded-xl shadow-md border border-gray-100">
            <h1 className="text-base font-bold text-gray-800 flex items-center gap-2"><MapPin className="text-blue-600 w-5 h-5" /> 배리어프리 지도</h1>
            <p className="text-xs text-gray-500 mt-1">💡 핀을 클릭해 <b>로드뷰</b>를 보거나 <b>민원</b>을 넣으세요!</p>
          </div>

          {/* 🛡️ 대망의 안전 경로(우회로) 필터 스위치 */}
          <button 
            onClick={toggleDetours}
            className={`px-4 py-3 rounded-xl shadow-md font-bold text-sm flex items-center gap-2 transition-all ${showOnlyDetours ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'}`}
          >
            <Navigation className="w-5 h-5" /> 
            {showOnlyDetours ? '안전 우회로 모드 켜짐' : '우회로 있는 제보만 보기'}
          </button>
        </div>
      )}

      {/* 오른쪽 제보 버튼 */}
      {mapLoaded && !isRoadviewOpen && (
        <div className="absolute bottom-8 right-6 z-10">
          <button onClick={() => { const center = map.getCenter(); setClickCoords({ lat: center.getLat(), lng: center.getLng() }); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95">
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* 🔴 로드뷰 도화지 (켜지면 전체 화면을 완전히 덮어버림!) */}
      <div 
        id="roadview" 
        className={`absolute inset-0 w-full h-full bg-black transition-opacity duration-300 ${isRoadviewOpen ? 'z-40 opacity-100' : '-z-10 opacity-0 pointer-events-none'}`}
      ></div>

      {/* 닫기 버튼 (로드뷰 켜졌을 때만) */}
      {isRoadviewOpen && (
        <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={() => setIsRoadviewOpen(false)} 
            className="bg-gray-900/80 hover:bg-black text-white px-5 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl backdrop-blur-sm transition-all border border-white/20"
          >
            <Map className="w-5 h-5" /> 지도로 돌아가기
          </button>
        </div>
      )}

      {/* 팝업 모달창 */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="text-amber-500" /> 실시간 핀포인트 제보</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">문제 유형 태그</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button key={t} onClick={() => setSelectedTag(t)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTag === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mb-4"><textarea className="w-full h-24 border rounded-xl p-3 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="불편 내용 상세 설명" value={content} onChange={(e) => setContent(e.target.value)} /></div>
            <div className="mb-6"><input type="text" className="w-full border rounded-xl p-3 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="안전한 대안 경로 (우회로) 공유" value={detour} onChange={(e) => setDetour(e.target.value)} /></div>
            
            <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2">
              <Send className="w-5 h-5" /> 핀포인트 제보 등록하기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}