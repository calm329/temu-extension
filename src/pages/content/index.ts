/**
 * DO NOT USE import someModule from '...';
 *
 * @issue-url https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
 *
 * Chrome extensions don't support modules in content scripts.
 * If you want to use other modules in content scripts, you need to import them via these files.
 *
 */
// import('@pages/content/ui');
// import('@pages/content/injected');

function isValidVideoUrl(url: string) {
  try {
    new URL(url);
    const extension = url.split('.').pop();
    return ['mp4', 'mov', 'avi', 'flv', 'wmv'].includes(extension);
  } catch (_) {
    return false;
  }
}

function isValidImageUrl(url: string) {
  try {
    new URL(url);
    const extension = url.split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  } catch (_) {
    return false;
  }
}

async function download(rawData, rateRange) {
  if (
    rawData.store.review.reviewData.mallReview.mallScore <= rateRange[0] ||
    rawData.store.review.reviewData.mallReview.mallScore >= rateRange[1]
  )
    return;

  console.log('1');

  const data = {};

  const size_guide = {
    inch: [],
    cm: [],
  };

  {
    const API_URL = 'https://www.temu.com/api/oak/size_guide/render';

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8',
        VerifyAuthToken: localStorage.getItem('VerifyAuthToken'),
      },
      body: JSON.stringify({
        goods_id: rawData.store.goods.goodsId,
        front_supports: ['supportSizeGuideV2Logic'],
      }),
    });

    const data = await res.json();

    try {
      for (const guide of data.size_chart.product_measurement[0].records_inch) {
        const inch = {};
        for (const item of data.size_chart.product_measurement[0].metas_v2) {
          inch[item.name] = guide[item.id];
        }
        size_guide.inch.push(inch);
      }

      for (const guide of data.size_chart.product_measurement[0].records_cm) {
        const cm = {};
        for (const item of data.size_chart.product_measurement[0].metas_v2) {
          cm[item.name] = guide[item.id];
        }
        size_guide.cm.push(cm);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const product_data = {
    goods: rawData.store.goods,
    sku: rawData.store.sku,
    size_guide,
    rating: rawData.store.review.reviewData.mallReview.mallScore,
    description:
      'description' in rawData.store ? rawData.store.description.items.map(item => item.values).join('\n\n') : '',
    long_description: rawData.store.productDetail.floorList
      .map(list =>
        list.items
          .map(item => item?.text)
          .filter(item => item)
          .join('\n\n'),
      )
      .filter(item => item)
      .join('\n\n'),
    videos: rawData.store.goods.gallery
      .map(item => item?.video?.videoUrl || item?.video?.url || item?.videoUrl)
      .filter(item => item && isValidVideoUrl(item)),
    images: rawData.store.productDetailFlatList
      .map(item => item.url || '')
      .filter(item => item && isValidImageUrl(item)),
  };

  data['product_title'] = rawData.store.goods.goodsName;
  data['product_url'] = new URL(window.location.href).pathname;
  data['category'] = rawData.store.crumbOptList[rawData.store.crumbOptList.length - 1]['title'];
  data['parent_category'] = rawData.store.crumbOptList[rawData.store.crumbOptList.length - 2]['title'];
  data['product_data'] = JSON.stringify(product_data);

  console.log(data);

  if (
    data['product_title'] &&
    data['product_url'] &&
    data['category'] &&
    data['parent_category'] &&
    data['product_data']
  ) {
    const blob = new Blob([JSON.stringify(data)], {
      type: 'text/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rawData.store.goods.goodsId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

document.onreadystatechange = function () {
  if (document.readyState == 'complete') {
    const script = document.createElement('script');
    script.textContent = `
      // Post message from page to extension
      window.postMessage({ type: "FROM_PAGE", text: window.rawData }, "*");
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  if (this.location.href.includes('https://www.temu.com/bgn_verification.html')) {
    chrome.runtime.sendMessage({ type: 'VERIFICATION' });
  }
};

window.addEventListener('message', function (event) {
  // Only accept messages from same frame
  if (event.source !== window) {
    return;
  }

  const message = event.data;

  // Only accept messages that we sent to ourselves
  if (typeof message !== 'object' || message === null || !message.type || message.type != 'FROM_PAGE') {
    return;
  }

  if (message.text?.store?.sku) {
    chrome.runtime.sendMessage({ type: 'GET_RATE_RANGE', data: message.text });
  } else if (message.text?.store?.goodsList) {
    // const urls = message.text?.store?.goodsList.map(
    //   (item) => "https://www.temu.com" + item.data.seoLinkUrl
    // );
    // chrome.runtime.sendMessage({ urls, type: "PRODUCT_URL" });
  }
});

chrome.runtime.onMessage.addListener(function (request) {
  if (request.type === 'GET_URLS') {
    const rateRange = request.rateRange;
    console.log(rateRange, 'rateRange');
    const urls = Array.from(document.querySelector('.contentContainer').querySelector('[role="region"]').children)
      .map(item => item.querySelector('a')?.href)
      .filter(item => item);

    chrome.runtime.sendMessage({ urls, type: 'PRODUCT_URL' });
  } else if (request.type === 'SEND_RATE_RANGE') {
    console.log('SEND_RATE_RANGE', request.data, request.rateRange);
    download(request.data, request.rateRange);
  }
});
