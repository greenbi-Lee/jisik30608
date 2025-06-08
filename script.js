// WeatherAPI.com 설정
const API_KEY = '3e8b2e487f07458ea1c21132250806';
const BASE_URL = 'https://api.weatherapi.com/v1';

// DOM 요소 선택
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherCard = document.getElementById('weatherCard');
const errorMessage = document.getElementById('errorMessage');
const forecastContainer = document.getElementById('forecastContainer');

// 날씨 정보를 표시할 요소들
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const cityName = document.getElementById('cityName');
const weatherDescription = document.getElementById('weatherDescription');
const lastUpdated = document.getElementById('lastUpdated');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const uvIndex = document.getElementById('uvIndex');
const visibility = document.getElementById('visibility');
const forecastGrid = document.getElementById('forecastGrid');
const errorText = document.getElementById('errorText');

// 초기화 함수
function init() {
    // 이벤트 리스너 등록
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 초기 위치 기반 날씨 정보 가져오기
    getCurrentLocationWeather();
}

// 검색 처리 함수
async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('도시명을 입력해주세요.');
        return;
    }
    
    await getWeatherData(city);
}

// 현재 위치 기반 날씨 정보 가져오기
function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await getWeatherData(`${latitude},${longitude}`);
            },
            async () => {
                // 위치 권한이 거부되었거나 오류가 발생한 경우 서울 날씨로 기본 설정
                await getWeatherData('Seoul');
            }
        );
    } else {
        // 위치 서비스를 지원하지 않는 경우 서울 날씨로 기본 설정
        getWeatherData('Seoul');
    }
}

// 날씨 데이터 가져오기
async function getWeatherData(location) {
    showLoading();
    
    try {
        // 현재 날씨와 3일 예보를 동시에 가져오기
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${location}&aqi=yes&lang=ko`),
            fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${location}&days=5&aqi=no&alerts=no&lang=ko`)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('날씨 정보를 가져올 수 없습니다.');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentData);
        displayForecastData(forecastData);
        hideLoading();
        
    } catch (error) {
        console.error('Weather API Error:', error);
        showError('날씨 정보를 가져오는데 실패했습니다. 도시명을 확인하고 다시 시도해주세요.');
        hideLoading();
    }
}

// 현재 날씨 데이터 표시
function displayWeatherData(data) {
    const { location, current } = data;
    
    // 기본 정보 표시
    temperature.textContent = `${Math.round(current.temp_c)}°`;
    weatherIcon.src = `https:${current.condition.icon}`;
    weatherIcon.alt = current.condition.text;
    cityName.textContent = `${location.name}, ${location.country}`;
    weatherDescription.textContent = current.condition.text;
    
    // 마지막 업데이트 시간
    const updateTime = new Date(current.last_updated);
    lastUpdated.textContent = `마지막 업데이트: ${updateTime.toLocaleString('ko-KR')}`;
    
    // 세부 정보 표시
    feelsLike.textContent = `${Math.round(current.feelslike_c)}°`;
    humidity.textContent = `${current.humidity}%`;
    windSpeed.textContent = `${current.wind_kph} km/h`;
    pressure.textContent = `${current.pressure_mb} hPa`;
    uvIndex.textContent = current.uv;
    visibility.textContent = `${current.vis_km} km`;
    
    // 도시 입력란 업데이트
    cityInput.value = location.name;
    
    // 카드 표시
    weatherCard.style.display = 'block';
    errorMessage.style.display = 'none';
}

// 예보 데이터 표시
function displayForecastData(data) {
    const { forecast } = data;
    
    // 예보 그리드 초기화
    forecastGrid.innerHTML = '';
    
    // 5일 예보 데이터 처리
    forecast.forecastday.forEach((day, index) => {
        const forecastItem = createForecastItem(day, index === 0);
        forecastGrid.appendChild(forecastItem);
    });
    
    // 예보 컨테이너 표시
    forecastContainer.style.display = 'block';
}

// 예보 아이템 생성
function createForecastItem(dayData, isToday) {
    const { date, day } = dayData;
    const dateObj = new Date(date);
    
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    
    // 날짜 포맷팅
    let dateText;
    if (isToday) {
        dateText = '오늘';
    } else {
        const options = { month: 'short', day: 'numeric', weekday: 'short' };
        dateText = dateObj.toLocaleDateString('ko-KR', options);
    }
    
    forecastItem.innerHTML = `
        <div class="forecast-date">${dateText}</div>
        <div class="forecast-icon">
            <img src="https:${day.condition.icon}" alt="${day.condition.text}">
        </div>
        <div class="forecast-temps">
            <span class="forecast-high">${Math.round(day.maxtemp_c)}°</span>
            <span class="forecast-low">${Math.round(day.mintemp_c)}°</span>
        </div>
        <div class="forecast-desc">${day.condition.text}</div>
    `;
    
    return forecastItem;
}

// 로딩 표시
function showLoading() {
    loadingSpinner.style.display = 'block';
    weatherCard.style.display = 'none';
    errorMessage.style.display = 'none';
    forecastContainer.style.display = 'none';
}

// 로딩 숨기기
function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// 에러 메시지 표시
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    weatherCard.style.display = 'none';
    forecastContainer.style.display = 'none';
}

// 유틸리티 함수들
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 자동완성 기능 (선택사항)
let autocompleteTimeout;

cityInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) return;
    
    try {
        const response = await fetch(`${BASE_URL}/search.json?key=${API_KEY}&q=${query}`);
        if (response.ok) {
            const suggestions = await response.json();
            // 여기에 자동완성 드롭다운을 구현할 수 있습니다.
            console.log('Suggestions:', suggestions);
        }
    } catch (error) {
        console.log('Autocomplete error:', error);
    }
}, 300));

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl+K 또는 Cmd+K로 검색창 포커스
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        cityInput.focus();
        cityInput.select();
    }
    
    // ESC 키로 검색창 포커스 해제
    if (e.key === 'Escape') {
        cityInput.blur();
    }
});

// PWA 지원을 위한 서비스 워커 등록 (선택사항)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 서비스 워커가 있다면 등록
        // navigator.serviceWorker.register('/sw.js');
    });
}

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
    console.log('온라인 상태로 변경됨');
});

window.addEventListener('offline', () => {
    showError('인터넷 연결을 확인해주세요.');
});

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', init);

// 전역 에러 핸들러
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
