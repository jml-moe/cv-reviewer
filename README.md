## Cara pakai

Dari root repo:

```bash
bun install
cp .env.example .env        # isi OPENAI_BASE_URL dan OPENAI_API_KEY

bun start <file-cv.txt> "<posisi>"

bun start samples/good-sample.txt "Backend Engineer"
bun start samples/bad-sample.txt "Frontend Engineer"
```

## Alur

```
INPUT    baca file CV + posisi
PROSES   [1/3] cvExtract  : teks CV -> data terstruktur
         [2/3] cvReview   : 3 aspek dinilai paralel -> skor akhir
         [3/3] cvAdvice   : saran perbaikan, hanya jika skor < 75
OUTPUT   rincian skor, verdict (di-stream), saran perbaikan
```

## Tiga pipeline

| File | Pattern | Step |
|---|---|---|
| `01-cv-extract.ts` | Extraction | `extract` lalu `validate` |
| `02-cv-review.ts` | Parallel fan-out | `skills`, `experience`, `background` bersamaan, lalu `score` |
| `03-cv-advice.ts` | Evaluator-optimizer | `draft`, `evaluate`, `revise` (hanya jika belum lolos) |
