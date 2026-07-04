# Gemini API Request/Response Example

## Sample Request

### Endpoint
```
POST /api/analyze-food
```

### Headers
```
Content-Type: multipart/form-data
```

### Body (FormData)
```
image: [File object - image/jpeg]
userId: "550e8400-e29b-41d4-a716-446655440000"
```

---

## Sample Gemini AI Response (Raw)

### Example 1: Nasi Goreng

**Input Image**: Foto nasi goreng dengan telur

**Gemini Response (Text)**:
```json
{
  "items": [
    {
      "name": "Nasi Goreng",
      "portion_estimate_g": 300,
      "calories": 450,
      "protein_g": 12,
      "carbs_g": 65,
      "fat_g": 15,
      "confidence": "high"
    },
    {
      "name": "Telur Mata Sapi",
      "portion_estimate_g": 50,
      "calories": 90,
      "protein_g": 7,
      "carbs_g": 0.5,
      "fat_g": 7,
      "confidence": "high"
    },
    {
      "name": "Kerupuk",
      "portion_estimate_g": 20,
      "calories": 100,
      "protein_g": 1,
      "carbs_g": 12,
      "fat_g": 5,
      "confidence": "medium"
    }
  ],
  "total_calories": 640,
  "total_protein_g": 20,
  "total_carbs_g": 77.5,
  "total_fat_g": 27
}
```

---

### Example 2: Sate Ayam

**Input Image**: Foto sate ayam dengan bumbu kacang

**Gemini Response**:
```json
{
  "items": [
    {
      "name": "Sate Ayam (10 tusuk)",
      "portion_estimate_g": 200,
      "calories": 350,
      "protein_g": 45,
      "carbs_g": 5,
      "fat_g": 15,
      "confidence": "high"
    },
    {
      "name": "Bumbu Kacang",
      "portion_estimate_g": 80,
      "calories": 180,
      "protein_g": 8,
      "carbs_g": 12,
      "fat_g": 12,
      "confidence": "medium"
    },
    {
      "name": "Lontong",
      "portion_estimate_g": 100,
      "calories": 120,
      "protein_g": 2,
      "carbs_g": 27,
      "fat_g": 0.5,
      "confidence": "high"
    }
  ],
  "total_calories": 650,
  "total_protein_g": 55,
  "total_carbs_g": 44,
  "total_fat_g": 27.5
}
```

---

### Example 3: Salad (Low Confidence)

**Input Image**: Foto salad dengan lighting kurang bagus

**Gemini Response**:
```json
{
  "items": [
    {
      "name": "Salad Sayur",
      "portion_estimate_g": 150,
      "calories": 80,
      "protein_g": 3,
      "carbs_g": 12,
      "fat_g": 2,
      "confidence": "low"
    },
    {
      "name": "Dressing",
      "portion_estimate_g": 30,
      "calories": 90,
      "protein_g": 0.5,
      "carbs_g": 3,
      "fat_g": 9,
      "confidence": "low"
    }
  ],
  "total_calories": 170,
  "total_protein_g": 3.5,
  "total_carbs_g": 15,
  "total_fat_g": 11
}
```

---

## API Response dari `/api/analyze-food`

### Success Response (200)
```json
{
  "items": [
    {
      "name": "Nasi Goreng",
      "portion_estimate_g": 300,
      "calories": 450,
      "protein_g": 12,
      "carbs_g": 65,
      "fat_g": 15,
      "confidence": "high"
    }
  ],
  "total_calories": 450,
  "total_protein_g": 12,
  "total_carbs_g": 65,
  "total_fat_g": 15,
  "photo_url": "https://ngeztyabfdquoheavtrc.supabase.co/storage/v1/object/public/food-photos/user-id/1234567890.jpg"
}
```

### Error Response (400)
```json
{
  "error": "Image and userId are required"
}
```

### Error Response (500 - Parse Error)
```json
{
  "error": "Failed to parse AI response. Please try again."
}
```

### Error Response (504 - Timeout)
```json
{
  "error": "AI analysis timed out. Please try again."
}
```

---

## Confidence Levels

### High Confidence ✅
- Makanan jelas terlihat
- Lighting bagus
- Angle foto bagus
- Item umum dan dikenal

### Medium Confidence ⚠️
- Sebagian item tertutup
- Lighting sedang
- Item agak jarang/tidak umum

### Low Confidence ⚠️
- Foto blur atau gelap
- Item sangat kecil atau jauh
- Makanan tidak jelas
- Perlu manual review dan edit

---

## Testing Tips

### Test dengan Foto yang Bagus:
1. **Lighting**: Pastikan cahaya cukup
2. **Angle**: Foto dari atas (bird's eye view)
3. **Focus**: Foto tidak blur
4. **Distance**: Tidak terlalu jauh
5. **Background**: Sederhana, tidak ramai

### Test Edge Cases:
1. Foto blur
2. Foto gelap
3. Multiple items (5+ items)
4. Makanan tidak umum
5. Foto dari samping

### Expected Behavior:
- **Normal case**: 2-5 detik response time
- **Complex image**: 5-10 detik
- **Error case**: Clear error message
- **Low confidence**: Badge warning pada item

---

## Manual Testing Checklist

- [ ] Upload foto → Analisis → Lihat hasil
- [ ] Edit nilai kalori manual
- [ ] Simpan ke database
- [ ] Cek di Supabase: food_logs table ada data baru
- [ ] Cek di Supabase: foto tersimpan di storage
- [ ] Test dengan foto blur (low confidence)
- [ ] Test dengan foto clear (high confidence)
- [ ] Test dengan multiple items (3+ items)
- [ ] Test error: upload file non-image
- [ ] Test error: file terlalu besar (>5MB)

Done! 🎉
