import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  fetchAdminSiteConfig,
  updateAdminSiteConfig,
  uploadAdminSiteAsset,
} from '../../features/admin/adminApi';
import { DEFAULT_SITE_CONFIG } from '../../features/site/siteApi';
import type { SiteConfig } from '../../types';

type SiteConfigFormValue = Omit<SiteConfig, 'targetAudience' | 'workflowSteps'> & {
  targetAudienceText: string;
  workflowStepsText: string;
};

function joinLines(items: string[]) {
  return items.join('\n');
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSiteConfig(site: SiteConfig): SiteConfig {
  return {
    ...DEFAULT_SITE_CONFIG,
    ...site,
    targetAudience: Array.isArray(site.targetAudience)
      ? site.targetAudience
      : DEFAULT_SITE_CONFIG.targetAudience,
    solutionHighlights: Array.isArray(site.solutionHighlights)
      ? site.solutionHighlights
      : DEFAULT_SITE_CONFIG.solutionHighlights,
    workflowSteps: Array.isArray(site.workflowSteps)
      ? site.workflowSteps
      : DEFAULT_SITE_CONFIG.workflowSteps,
    referenceGallery: Array.isArray(site.referenceGallery)
      ? site.referenceGallery
      : DEFAULT_SITE_CONFIG.referenceGallery,
  };
}

function toFormValue(site: SiteConfig): SiteConfigFormValue {
  const normalizedSite = normalizeSiteConfig(site);

  return {
    ...normalizedSite,
    targetAudienceText: joinLines(normalizedSite.targetAudience),
    workflowStepsText: joinLines(normalizedSite.workflowSteps),
  };
}

function toSiteConfig(form: SiteConfigFormValue): SiteConfig {
  return {
    ...form,
    brandName: form.brandName.trim(),
    heroTitle: form.heroTitle.trim(),
    heroSubtitle: form.heroSubtitle.trim(),
    resultLinkNotice: form.resultLinkNotice.trim(),
    customerSummaryTitle: form.customerSummaryTitle.trim(),
    customerSummaryText: form.customerSummaryText.trim(),
    targetAudienceTitle: form.targetAudienceTitle.trim(),
    targetAudience: splitLines(form.targetAudienceText),
    solutionHighlightsTitle: form.solutionHighlightsTitle.trim(),
    solutionHighlights: form.solutionHighlights
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        ...(item.tag?.trim() ? { tag: item.tag.trim() } : {}),
      }))
      .filter((item) => item.title && item.description),
    workflowTitle: form.workflowTitle.trim(),
    workflowSteps: splitLines(form.workflowStepsText),
    referenceGalleryTitle: form.referenceGalleryTitle.trim(),
    referenceGallery: form.referenceGallery
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        imageUrl: item.imageUrl.trim(),
        ...(item.badge?.trim() ? { badge: item.badge.trim() } : {}),
      }))
      .filter((item) => item.title && item.description && item.imageUrl),
  };
}

function createEmptyHighlight() {
  return {
    title: '',
    description: '',
    tag: '',
  };
}

function createEmptyReference() {
  return {
    title: '',
    description: '',
    imageUrl: '',
    badge: '',
  };
}

export function AdminSitePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SiteConfigFormValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingReferenceIndex, setUploadingReferenceIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchAdminSiteConfig()
      .then((site) => {
        if (!active) {
          return;
        }
        setForm(toFormValue(site));
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : '加载站点配置失败';
        if (message.includes('未登录') || message.includes('登录已失效')) {
          navigate('/admin/login', { replace: true });
          return;
        }

        setErrorMessage(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  function updateForm<K extends keyof SiteConfigFormValue>(key: K, value: SiteConfigFormValue[K]) {
    setForm((currentValue) => (currentValue ? { ...currentValue, [key]: value } : currentValue));
    setSuccessMessage(null);
  }

  function updateHighlight(
    index: number,
    key: keyof SiteConfig['solutionHighlights'][number],
    value: string,
  ) {
    setForm((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      const solutionHighlights = currentValue.solutionHighlights.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      );

      return {
        ...currentValue,
        solutionHighlights,
      };
    });
    setSuccessMessage(null);
  }

  function removeHighlight(index: number) {
    setForm((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      return {
        ...currentValue,
        solutionHighlights: currentValue.solutionHighlights.filter((_, itemIndex) => itemIndex !== index),
      };
    });
    setSuccessMessage(null);
  }

  function addHighlight() {
    setForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            solutionHighlights: [...currentValue.solutionHighlights, createEmptyHighlight()],
          }
        : currentValue,
    );
    setSuccessMessage(null);
  }

  function updateReference(
    index: number,
    key: keyof SiteConfig['referenceGallery'][number],
    value: string,
  ) {
    setForm((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      const referenceGallery = currentValue.referenceGallery.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      );

      return {
        ...currentValue,
        referenceGallery,
      };
    });
    setSuccessMessage(null);
  }

  function removeReference(index: number) {
    setForm((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      return {
        ...currentValue,
        referenceGallery: currentValue.referenceGallery.filter((_, itemIndex) => itemIndex !== index),
      };
    });
    setSuccessMessage(null);
  }

  function addReference() {
    setForm((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            referenceGallery: [...currentValue.referenceGallery, createEmptyReference()],
          }
        : currentValue,
    );
    setSuccessMessage(null);
  }

  async function handleReferenceUpload(index: number, file: File | null) {
    if (!file) {
      return;
    }

    setUploadingReferenceIndex(index);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const asset = await uploadAdminSiteAsset(file);
      updateReference(index, 'imageUrl', asset.url);
      setSuccessMessage('参考图已上传，图片地址已自动回填');
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传参考图失败';
      if (message.includes('未登录') || message.includes('登录已失效')) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(message);
    } finally {
      setUploadingReferenceIndex((currentValue) => (currentValue === index ? null : currentValue));
    }
  }

  async function handleSave() {
    if (!form) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const savedSite = await updateAdminSiteConfig(toSiteConfig(form));
      setForm(toFormValue(savedSite));
      setSuccessMessage('站点配置已保存');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存站点配置失败';
      if (message.includes('未登录') || message.includes('登录已失效')) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>站点内容</h1>
        <p className="lead-text">维护首页宣传表达、客户资料摘要与参考物料，让前台内容真正跟着客户资料走。</p>
      </header>

      {loading ? <p className="lead-text">正在加载站点配置...</p> : null}
      {errorMessage ? <p className="lead-text">{errorMessage}</p> : null}

      {!loading && form ? (
        <>
          <AcrylicCard eyebrow="Brand" title="品牌与首页 Hero">
            <div className="admin-form-grid">
              <label className="field-stack" htmlFor="admin-site-brandName">
                <span>品牌名称</span>
                <input
                  id="admin-site-brandName"
                  aria-label="品牌名称"
                  className="fluent-input"
                  value={form.brandName}
                  onChange={(event) => updateForm('brandName', event.target.value)}
                />
              </label>
              <label className="field-stack" htmlFor="admin-site-defaultDisplayMultiplier">
                <span>默认展示倍率</span>
                <input
                  id="admin-site-defaultDisplayMultiplier"
                  className="fluent-input"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.defaultDisplayMultiplier}
                  onChange={(event) =>
                    updateForm('defaultDisplayMultiplier', Number(event.target.value || 0))
                  }
                />
              </label>
              <label className="field-stack admin-form-grid-full" htmlFor="admin-site-heroTitle">
                <span>首页主标题</span>
                <input
                  id="admin-site-heroTitle"
                  aria-label="首页主标题"
                  className="fluent-input"
                  value={form.heroTitle}
                  onChange={(event) => updateForm('heroTitle', event.target.value)}
                />
              </label>
              <label className="field-stack admin-form-grid-full" htmlFor="admin-site-heroSubtitle">
                <span>Hero 副标题</span>
                <textarea
                  id="admin-site-heroSubtitle"
                  className="fluent-textarea"
                  rows={3}
                  value={form.heroSubtitle}
                  onChange={(event) => updateForm('heroSubtitle', event.target.value)}
                />
              </label>
              <label
                className="field-stack admin-form-grid-full"
                htmlFor="admin-site-resultLinkNotice"
              >
                <span>结果提醒</span>
                <textarea
                  id="admin-site-resultLinkNotice"
                  className="fluent-textarea"
                  rows={2}
                  value={form.resultLinkNotice}
                  onChange={(event) => updateForm('resultLinkNotice', event.target.value)}
                />
              </label>
            </div>
          </AcrylicCard>

          <AcrylicCard eyebrow="Brief" title="客户资料摘要">
            <div className="admin-form-grid">
              <label className="field-stack" htmlFor="admin-site-customerSummaryTitle">
                <span>摘要标题</span>
                <input
                  id="admin-site-customerSummaryTitle"
                  className="fluent-input"
                  value={form.customerSummaryTitle}
                  onChange={(event) => updateForm('customerSummaryTitle', event.target.value)}
                />
              </label>
              <label className="field-stack" htmlFor="admin-site-targetAudienceTitle">
                <span>适用对象标题</span>
                <input
                  id="admin-site-targetAudienceTitle"
                  className="fluent-input"
                  value={form.targetAudienceTitle}
                  onChange={(event) => updateForm('targetAudienceTitle', event.target.value)}
                />
              </label>
              <label
                className="field-stack admin-form-grid-full"
                htmlFor="admin-site-customerSummaryText"
              >
                <span>摘要正文</span>
                <textarea
                  id="admin-site-customerSummaryText"
                  className="fluent-textarea"
                  rows={4}
                  value={form.customerSummaryText}
                  onChange={(event) => updateForm('customerSummaryText', event.target.value)}
                />
              </label>
              <label
                className="field-stack admin-form-grid-full"
                htmlFor="admin-site-targetAudienceText"
              >
                <span>适用对象</span>
                <textarea
                  id="admin-site-targetAudienceText"
                  aria-label="适用对象"
                  className="fluent-textarea"
                  rows={4}
                  value={form.targetAudienceText}
                  onChange={(event) => updateForm('targetAudienceText', event.target.value)}
                />
              </label>
              <label className="field-stack" htmlFor="admin-site-workflowTitle">
                <span>流程标题</span>
                <input
                  id="admin-site-workflowTitle"
                  className="fluent-input"
                  value={form.workflowTitle}
                  onChange={(event) => updateForm('workflowTitle', event.target.value)}
                />
              </label>
              <label
                className="field-stack admin-form-grid-full"
                htmlFor="admin-site-workflowStepsText"
              >
                <span>流程步骤</span>
                <textarea
                  id="admin-site-workflowStepsText"
                  className="fluent-textarea"
                  rows={4}
                  value={form.workflowStepsText}
                  onChange={(event) => updateForm('workflowStepsText', event.target.value)}
                />
              </label>
            </div>
          </AcrylicCard>

          <AcrylicCard
            eyebrow="Highlights"
            title={form.solutionHighlightsTitle || '宣传亮点'}
            actions={
              <PrimaryButton type="button" variant="ghost" onClick={addHighlight}>
                新增亮点
              </PrimaryButton>
            }
          >
            <div className="admin-form-grid">
              <label className="field-stack admin-form-grid-full" htmlFor="admin-site-solutionHighlightsTitle">
                <span>亮点区标题</span>
                <input
                  id="admin-site-solutionHighlightsTitle"
                  className="fluent-input"
                  value={form.solutionHighlightsTitle}
                  onChange={(event) => updateForm('solutionHighlightsTitle', event.target.value)}
                />
              </label>
            </div>

            <div className="admin-collection">
              {form.solutionHighlights.map((item, index) => (
                <div key={`highlight-${index}`} className="admin-collection-item">
                  <div className="admin-form-grid">
                    <label className="field-stack" htmlFor={`highlight-title-${index}`}>
                      <span>亮点标题</span>
                      <input
                        id={`highlight-title-${index}`}
                        className="fluent-input"
                        value={item.title}
                        onChange={(event) => updateHighlight(index, 'title', event.target.value)}
                      />
                    </label>
                    <label className="field-stack" htmlFor={`highlight-tag-${index}`}>
                      <span>角标</span>
                      <input
                        id={`highlight-tag-${index}`}
                        className="fluent-input"
                        value={item.tag ?? ''}
                        onChange={(event) => updateHighlight(index, 'tag', event.target.value)}
                      />
                    </label>
                    <label className="field-stack admin-form-grid-full" htmlFor={`highlight-description-${index}`}>
                      <span>亮点说明</span>
                      <textarea
                        id={`highlight-description-${index}`}
                        className="fluent-textarea"
                        rows={3}
                        value={item.description}
                        onChange={(event) =>
                          updateHighlight(index, 'description', event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="button-row">
                    <PrimaryButton type="button" variant="ghost" onClick={() => removeHighlight(index)}>
                      删除亮点
                    </PrimaryButton>
                  </div>
                </div>
              ))}
            </div>
          </AcrylicCard>

          <AcrylicCard
            eyebrow="References"
            title={form.referenceGalleryTitle || '客户参考物料'}
            actions={
              <PrimaryButton type="button" variant="ghost" onClick={addReference}>
                新增物料
              </PrimaryButton>
            }
          >
            <div className="admin-form-grid">
              <label className="field-stack admin-form-grid-full" htmlFor="admin-site-referenceGalleryTitle">
                <span>物料区标题</span>
                <input
                  id="admin-site-referenceGalleryTitle"
                  className="fluent-input"
                  value={form.referenceGalleryTitle}
                  onChange={(event) => updateForm('referenceGalleryTitle', event.target.value)}
                />
              </label>
            </div>

            <div className="admin-collection">
              {form.referenceGallery.map((item, index) => (
                <div key={`reference-${index}`} className="admin-collection-item">
                  <div className="admin-reference-preview">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.title || `参考物料 ${index + 1}`}
                    />
                  </div>
                  <div className="admin-form-grid">
                    <label className="field-stack" htmlFor={`reference-title-${index}`}>
                      <span>物料标题</span>
                      <input
                        id={`reference-title-${index}`}
                        className="fluent-input"
                        value={item.title}
                        onChange={(event) => updateReference(index, 'title', event.target.value)}
                      />
                    </label>
                    <label className="field-stack" htmlFor={`reference-badge-${index}`}>
                      <span>角标</span>
                      <input
                        id={`reference-badge-${index}`}
                        className="fluent-input"
                        value={item.badge ?? ''}
                        onChange={(event) => updateReference(index, 'badge', event.target.value)}
                      />
                    </label>
                    <label className="field-stack admin-form-grid-full" htmlFor={`reference-image-${index}`}>
                      <span>图片地址</span>
                      <input
                        id={`reference-image-${index}`}
                        className="fluent-input"
                        value={item.imageUrl}
                        onChange={(event) => updateReference(index, 'imageUrl', event.target.value)}
                      />
                    </label>
                    <div className="field-stack admin-form-grid-full">
                      <span>上传参考图</span>
                      <input
                        id={`reference-upload-${index}`}
                        aria-label={`上传参考图 ${index + 1}`}
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const [file] = Array.from(event.target.files ?? []);
                          void handleReferenceUpload(index, file ?? null);
                          event.currentTarget.value = '';
                        }}
                      />
                      <label
                        className="button-link button-link-secondary"
                        htmlFor={`reference-upload-${index}`}
                      >
                        {uploadingReferenceIndex === index ? '上传中...' : '选择图片并自动回填'}
                      </label>
                    </div>
                    <label className="field-stack admin-form-grid-full" htmlFor={`reference-description-${index}`}>
                      <span>物料说明</span>
                      <textarea
                        id={`reference-description-${index}`}
                        className="fluent-textarea"
                        rows={3}
                        value={item.description}
                        onChange={(event) =>
                          updateReference(index, 'description', event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="button-row">
                    <PrimaryButton type="button" variant="ghost" onClick={() => removeReference(index)}>
                      删除物料
                    </PrimaryButton>
                  </div>
                </div>
              ))}
            </div>
          </AcrylicCard>

          <div className="button-row">
            <PrimaryButton type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? '保存中...' : '保存站点内容'}
            </PrimaryButton>
            {successMessage ? <p className="field-note">{successMessage}</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
