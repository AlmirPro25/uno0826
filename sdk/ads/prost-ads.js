/**
 * PROST-QS Ads SDK
 * "Gateway de Anúncios de Borda"
 * 
 * SDK para renderizar anúncios do PROST-QS Kernel
 */

(function(global) {
  'use strict';

  const PROST_ADS_VERSION = '1.0.0';

  class ProstAds {
    constructor(config) {
      this.appId = config.appId;
      this.baseUrl = config.baseUrl || 'https://api.prostqs.com';
      this.debug = config.debug || false;
      this.onError = config.onError || console.error;
      this.onImpression = config.onImpression || (() => {});
      this.onClick = config.onClick || (() => {});
      
      // Device info
      this.deviceId = this._getDeviceId();
      this.userAgent = navigator.userAgent;
      
      this._log('ProstAds initialized', { appId: this.appId });
    }

    // ========================================
    // PUBLIC API
    // ========================================

    /**
     * Renderiza um anúncio em um slot
     * @param {Object} options - Opções de renderização
     * @param {string} options.slot - Nome do slot (ex: "homepage.hero")
     * @param {string} options.container - ID do elemento container
     * @param {string} [options.userId] - ID do usuário (se logado)
     * @param {string} [options.plan] - Plano do usuário (free, starter, pro)
     * @param {Object} [options.metadata] - Metadados adicionais
     */
    async render(options) {
      const { slot, container, userId, plan, metadata } = options;
      
      if (!slot || !container) {
        this.onError(new Error('slot and container are required'));
        return null;
      }

      const containerEl = document.getElementById(container);
      if (!containerEl) {
        this.onError(new Error(`Container #${container} not found`));
        return null;
      }

      try {
        // Request ad
        const ad = await this._requestAd(slot, userId, plan, metadata);
        
        if (ad.no_fill) {
          this._log('No fill', { slot, reason: ad.reason });
          containerEl.style.display = 'none';
          return null;
        }

        // Render ad
        this._renderAd(containerEl, ad);
        
        // Track impression
        this._trackImpression(ad.impression_id);
        
        return ad;
      } catch (error) {
        this.onError(error);
        containerEl.style.display = 'none';
        return null;
      }
    }


    /**
     * Pré-carrega anúncios para slots específicos
     * @param {string[]} slots - Lista de slots para pré-carregar
     */
    async preload(slots) {
      const promises = slots.map(slot => this._requestAd(slot));
      const results = await Promise.allSettled(promises);
      
      const cache = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.no_fill) {
          cache[slots[index]] = result.value;
        }
      });
      
      this._adCache = cache;
      this._log('Preloaded ads', { slots: Object.keys(cache) });
      return cache;
    }

    /**
     * Limpa o cache de anúncios
     */
    clearCache() {
      this._adCache = {};
    }

    // ========================================
    // PRIVATE METHODS
    // ========================================

    async _requestAd(slot, userId, plan, metadata) {
      const requestId = this._generateRequestId();
      
      const body = {
        slot,
        app_id: this.appId,
        device_id: this.deviceId,
        user_id: userId,
        plan: plan,
        country: this._getCountry(),
        language: navigator.language,
        device_type: this._getDeviceType(),
        metadata: metadata
      };

      this._log('Requesting ad', { slot, requestId });

      const response = await fetch(`${this.baseUrl}/api/v1/ads/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Ad request failed: ${response.status}`);
      }

      const ad = await response.json();
      this._log('Ad response', { slot, noFill: ad.no_fill, latency: ad.latency_ms });
      
      return ad;
    }

    _renderAd(container, ad) {
      container.innerHTML = '';
      container.style.display = 'block';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'prost-ad';
      wrapper.setAttribute('data-ad-id', ad.ad_id);
      wrapper.setAttribute('data-impression-id', ad.impression_id);

      switch (ad.format) {
        case 'banner':
          this._renderBanner(wrapper, ad);
          break;
        case 'native':
          this._renderNative(wrapper, ad);
          break;
        case 'video':
          this._renderVideo(wrapper, ad);
          break;
        default:
          this._renderBanner(wrapper, ad);
      }

      container.appendChild(wrapper);
    }

    _renderBanner(wrapper, ad) {
      const link = document.createElement('a');
      link.href = ad.click_url;
      link.target = '_blank';
      link.rel = 'noopener sponsored';
      link.onclick = (e) => this._handleClick(e, ad);

      if (ad.content_url) {
        const img = document.createElement('img');
        img.src = ad.content_url;
        img.alt = ad.title || 'Advertisement';
        img.style.maxWidth = '100%';
        link.appendChild(img);
      }

      wrapper.appendChild(link);
      this._addAdLabel(wrapper);
    }

    _renderNative(wrapper, ad) {
      const card = document.createElement('div');
      card.className = 'prost-ad-native';
      card.style.cssText = 'border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; cursor: pointer;';
      card.onclick = (e) => this._handleClick(e, ad);

      if (ad.content_url) {
        const img = document.createElement('img');
        img.src = ad.content_url;
        img.style.cssText = 'width: 100%; border-radius: 4px; margin-bottom: 12px;';
        card.appendChild(img);
      }

      if (ad.title) {
        const title = document.createElement('h4');
        title.textContent = ad.title;
        title.style.cssText = 'margin: 0 0 8px 0; font-size: 16px;';
        card.appendChild(title);
      }

      if (ad.description) {
        const desc = document.createElement('p');
        desc.textContent = ad.description;
        desc.style.cssText = 'margin: 0 0 12px 0; font-size: 14px; color: #666;';
        card.appendChild(desc);
      }

      if (ad.cta_text) {
        const cta = document.createElement('button');
        cta.textContent = ad.cta_text;
        cta.style.cssText = 'background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;';
        card.appendChild(cta);
      }

      wrapper.appendChild(card);
      this._addAdLabel(wrapper);
    }

    _renderVideo(wrapper, ad) {
      const video = document.createElement('video');
      video.src = ad.content_url;
      video.controls = true;
      video.autoplay = false;
      video.muted = true;
      video.style.maxWidth = '100%';
      
      video.onended = () => this._handleClick(null, ad);
      
      wrapper.appendChild(video);
      this._addAdLabel(wrapper);
    }

    _addAdLabel(wrapper) {
      const label = document.createElement('span');
      label.textContent = 'Ad';
      label.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 6px; border-radius: 2px;';
      wrapper.style.position = 'relative';
      wrapper.appendChild(label);
    }


    _handleClick(event, ad) {
      if (event) {
        event.preventDefault();
      }
      
      this._trackClick(ad.impression_id);
      this.onClick(ad);
      
      if (ad.click_url) {
        window.open(ad.click_url, '_blank', 'noopener');
      }
    }

    async _trackImpression(impressionId) {
      try {
        await fetch(`${this.baseUrl}/api/v1/ads/track/${impressionId}/impression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        this.onImpression({ impressionId });
        this._log('Impression tracked', { impressionId });
      } catch (error) {
        this._log('Failed to track impression', { error: error.message });
      }
    }

    async _trackClick(impressionId) {
      try {
        await fetch(`${this.baseUrl}/api/v1/ads/track/${impressionId}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        this._log('Click tracked', { impressionId });
      } catch (error) {
        this._log('Failed to track click', { error: error.message });
      }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    _getDeviceId() {
      let deviceId = localStorage.getItem('prost_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 16);
        localStorage.setItem('prost_device_id', deviceId);
      }
      return deviceId;
    }

    _generateRequestId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    }

    _getDeviceType() {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return 'mobile';
      if (/tablet/i.test(ua)) return 'tablet';
      return 'desktop';
    }

    _getCountry() {
      // Would use geolocation API or IP-based detection in production
      return navigator.language.split('-')[1] || 'BR';
    }

    _log(...args) {
      if (this.debug) {
        console.log('[ProstAds]', ...args);
      }
    }
  }

  // ========================================
  // EXPORT
  // ========================================

  // UMD export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProstAds;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() { return ProstAds; });
  } else {
    global.ProstAds = ProstAds;
  }

  // Auto-init from data attributes
  document.addEventListener('DOMContentLoaded', function() {
    const autoInit = document.querySelector('[data-prost-ads-auto]');
    if (autoInit) {
      const appId = autoInit.getAttribute('data-prost-app-id');
      const baseUrl = autoInit.getAttribute('data-prost-base-url');
      
      if (appId) {
        global.prostAds = new ProstAds({ appId, baseUrl });
        
        // Auto-render slots
        document.querySelectorAll('[data-prost-slot]').forEach(el => {
          const slot = el.getAttribute('data-prost-slot');
          global.prostAds.render({
            slot,
            container: el.id
          });
        });
      }
    }
  });

})(typeof window !== 'undefined' ? window : this);
