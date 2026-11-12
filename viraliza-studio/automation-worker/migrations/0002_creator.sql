CREATE TABLE IF NOT EXISTS creator_jobs (
 id TEXT PRIMARY KEY, product_id TEXT NOT NULL DEFAULT '', name TEXT NOT NULL,
 product_image TEXT NOT NULL, affiliate_url TEXT NOT NULL,
 model_label TEXT NOT NULL, model_prompt TEXT NOT NULL, face_url TEXT NOT NULL DEFAULT '',
 quality TEXT NOT NULL DEFAULT '720', caption TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('queued','image_submitting','image_processing','video_queued','video_submitting','video_processing','review','approved','published','needs_review','cancelled')),
 image_prediction_id TEXT, video_prediction_id TEXT, model_image TEXT, video_url TEXT,
 saved_image INTEGER NOT NULL DEFAULT 0, saved_video INTEGER NOT NULL DEFAULT 0,
 credits_estimate INTEGER NOT NULL DEFAULT 0, error TEXT, tiktok_post_url TEXT,
 published_at TEXT, views INTEGER NOT NULL DEFAULT 0, clicks INTEGER NOT NULL DEFAULT 0,
 orders INTEGER NOT NULL DEFAULT 0, commission REAL NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS creator_jobs_queue ON creator_jobs(status,created_at);
