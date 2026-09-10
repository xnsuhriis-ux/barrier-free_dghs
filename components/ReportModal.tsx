"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ReportModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

// 1) 소음 카테고리 추가
const CATEGORIES = ["점자블록 파손", "불법 적치물", "높은 턱/단차", "소음", "기타"];

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 정보 기능을 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

export default function ReportModal({ onClose, onSuccess }: ReportModalProps) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  // 2) 직접 입력을 위한 상태 추가
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // 3) '기타' 선택 시 직접 입력한 값을 최종 카테고리로 설정
    const finalCategory = category === "기타" ? customCategory.trim() : category;

    if (category === "기타" && !finalCategory) {
      setError("기타 문제 유형을 직접 입력해 주세요.");
      return;
    }

    if (!description.trim()) {
      setError("상세 설명을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const position = await getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let imageUrl = "";
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("barrier-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error(`이미지 업로드에 실패했습니다: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("barrier-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // 4) 최종 카테고리(finalCategory)로 DB에 저장
      const { error: insertError } = await supabase.from("reports").insert({
        latitude,
        longitude,
        category: finalCategory,
        description: description.trim(),
        image_url: imageUrl,
      });

      if (insertError) {
        throw new Error(`제보 등록에 실패했습니다: ${insertError.message}`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">장애물 제보하기</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              사진
            </label>
            <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="업로드할 사진 미리보기"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Camera className="mb-2 text-gray-400" size={28} />
                  <span className="text-sm text-gray-500">사진을 선택하세요</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              카테고리
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    if (cat !== "기타") setCustomCategory(""); // 다른 버튼 누르면 입력창 초기화
                  }}
                  aria-pressed={category === cat}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    category === cat
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {/* 5) '기타' 선택 시 나타나는 조건부 입력창 */}
            {category === "기타" && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="문제 유형을 직접 적어주세요 (예: 공사 중)"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              상세 설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="어떤 문제가 있는지 자세히 적어주세요."
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                등록 중...
              </>
            ) : (
              "제보 등록하기"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}