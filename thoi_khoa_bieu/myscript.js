// Phần gdien đăng nhập của ext
const wrapper = document.querySelector('.wrapper');
// Nút mở gdien đăng nhập của ext
const btnPopup = document.querySelector('.btnLogin-popup');
// Nút login
const btnLogin = document.querySelector('.btn');
// Nút remember 
const btnRmb = document.querySelector('.rm');
// Phần hiện thông tin gthieu 
const intro = document.querySelector('.introduce');
// Phần chuyển tuần trc và tuần sau
const pnday = document.querySelector('.box');
// Phần hiện tkb
const tl = document.querySelector('.taskList');
// Icon của thông báo lịch học ngày mai
const notification = document.querySelector('.icon_noti');
// Popup của thông báo lịch học ngày mai
const notipopup = document.querySelector('.noti_box');
// Icon của lịch thi
const test = document.querySelector('.icon_test');
// Popup của lịch thi
const testpopup = document.querySelector('.test_box');
// Icon của thông báo từ học viện
const news = document.querySelector('.icon_news');
// Popup của thông báo từ học viện
const newspopup = document.querySelector('.news_box');
// Nút logout
const logoutBtn = document.getElementById('logoutBtn');

// Tkhoan, mkhau từ ô nhập liệu
const un = document.getElementById('username');
const pw = document.getElementById('password');

var today = new Date();
today.setDate(today.getDate() + 0);

var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

var lastweek = new Date();

var thisweek = new Date();
thisweek.setDate(thisweek.getDate() + 0);

var nextweek = new Date();

// Nếu là chủ nhật thì lùi về chủ nhật tuần trc
if (today.getDay() === 0)
    thisweek.setDate(thisweek.getDate() - 7);

var tasks = [];

var z = 0;


// Đồng hồ
function updateTime() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var timeString = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    document.getElementById('time').innerHTML = timeString;
}

// Đẩy thông tin đăng nhập lên background
function Receive() {
    let user = un.value + " " + pw.value;
    chrome.runtime.sendMessage({
        method: "send", key: "key", value: user
    }, () => { });
}

// Lấy thông tin đăng nhập từ background và gửi đến trang qldt để thực hiện đăng nhập
function Send() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
            document.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtTaiKhoa").value =
                response.value.split(" ")[0];
        });
        chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
            document.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtMatKhau").value =
                response.value.split(" ")[1];
            if (document.getElementById("ctl00_ContentPlaceHolder1_ctl00_txtMatKhau").value) {
                resolve();
            }
        });
    }).then(() => {
        const btnli = document.querySelector('.DefaultButton');
        btnli.click();
    });
}

// Lấy thời khóa biểu tuần có chứa ngày được chọn (td)
function getData(td) {
    let Tasks = localStorage.getItem('tasks');

    if (!Tasks) Tasks = [];
    else Tasks = JSON.parse(Tasks);

    // Lấy thông tin ngày đầu tiên của kì và xác định ngày hiện tại thuộc tuần thứ bao nhiêu 
    var st0 = Tasks[0].id.slice(3, 6) + Tasks[0].id.slice(0, 3) + Tasks[0].id.slice(6);
    const startdate = new Date(st0);
    const timeDiff = Math.floor(td.getTime() - startdate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const week = Math.floor(diffDays / 7);
    const dayOfWeek = td.getDay();

    // Xác định các ngày trong tuần 
    const monday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek + 1);
    const tuesday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek + 2);
    const wednesday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek + 3);
    const thusday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek + 4);
    const friday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek + 5);
    const saturday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek + 6);
    const sunday = new Date(td.getFullYear(), td.getMonth(), td.getDate() - dayOfWeek);
    sunday.setDate(sunday.getDate() + 7);

    // Xác định thời gian bắt đầu và kết thúc của kíp học dựa vào tiết bắt đầu
    function tiet(start, task, th) {
        if (start === '1') {
            task.time = '07:00 - 09:00';
            if (th !== '') task.time = '07:00 - 11:00';
        }
        else if (start === '3') {
            task.time = '09:00 - 11:00';
        }
        else if (start === '5') {
            task.time = '12:00 - 14:00';
            if (th !== '') task.time = '12:00 - 16:00';
        }
        else if (start === '7') {
            task.time = '14:00 - 16:00';
        }
        else if (start === '9') {
            task.time = '16:00 - 18:00';
            if (th !== '') task.time = '16:00 - 20:00';
        }
        else if (start === '11') {
            task.time = '18:00 - 20:00';
        }
    }

    const sche = [];

    // Xét thông tin từng môn 
    for (let i = 1; i < Tasks.length; i++) {
        const task = Tasks[i];
        // Dựa vào tuần hiện tại tính được ở trên sẽ xác định được các môn học có tiết hay không trong tuần đó
        const taskSche = task.sch[week];

        // Lấy ra thông tin về ngày dựa vào thứ, thời gian, tên môn, phòng, và kiểm tra có phải tiết thực hành không 
        if (taskSche !== '-' && taskSche !== undefined) {
            if (task.dow === 'Hai') {
                tiet(task.start, task, task.th);
                task.date = monday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
            else if (task.dow === 'Ba') {
                tiet(task.start, task, task.th);
                task.date = tuesday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
            else if (task.dow === 'Tư') {
                tiet(task.start, task, task.th);
                task.date = wednesday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
            else if (task.dow === 'Năm') {
                tiet(task.start, task, task.th);
                task.date = thusday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
            else if (task.dow === 'Sáu') {
                tiet(task.start, task, task.th);
                task.date = friday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
            else if (task.dow === 'Bảy') {
                tiet(task.start, task, task.th);
                task.date = saturday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
            else if (task.dow === 'CN') {
                tiet(task.start, task, task.th);
                task.date = sunday.toDateString();
                sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
            }
        }
    }

    // Sắp xếp lại mảng theo đúng thứ tự ngày giờ
    const sortedSche = sche.sort((a, b) => {
        const aDate = new Date(a.split("\n")[0]);
        const bDate = new Date(b.split("\n")[0]);
        if (aDate.getDay() === bDate.getDay()) {
            const aTime = new Date(`01/01/2000 ${a.split("\n")[1].split(" - ")[0]}`);
            const bTime = new Date(`01/01/2000 ${b.split("\n")[1].split(" - ")[0]}`);
            return aTime - bTime;
        }
        return aDate.getDay() - bDate.getDay();
    });

    document.querySelector('.nmai').innerHTML = `Thông báo Ngày Mai: [${tomorrow.toDateString()}]`;

    // Hiển thị thông tin thời khóa biểu trong tuần hiện tại (nếu có)
    if (sortedSche.length !== 0) {
        check = 0; // check để chỉ tìm lịch ngày mai 1 lần
        const taskElement = document.createElement('div');
        taskElement.classList.add("thisweek");
        taskElement.innerHTML = `
            <h2>[ ${monday.toDateString()} - ${sunday.toDateString()} ]</h2><br>
        `;
        document.querySelector('.taskList').appendChild(taskElement);
        for (let i = 0; i < sche.length; i++) {
            const ed = document.createElement('div');
            ed.classList.add("eachday");
            ed.id = i;
            ed.innerHTML += `
                <h3>${sche[i].split('\n')[0]}</h3>
                <pre>
                    <p>     - Time: ${sche[i].split('\n')[1]} ${sche[i].split('\n')[4] !== '' ? " (Thực Hành)" : ""}
                    <p>     - Name: ${sche[i].split('\n')[2]}
                    <p>     - Room: ${sche[i].split('\n')[3]}
                </pre>          
            `;
            document.querySelector('.thisweek').appendChild(ed);

            // Bôi xanh lịch học của ngày hôm nay (nếu có)
            if (sche[i].split('\n')[0] === today.toDateString()) {
                document.getElementById(i).style.backgroundColor = 'aquamarine';
            }

            // Xử lý nếu hôm nay là chủ nhật để có thông tin về thứ hai của tuần tới
            if (today.getDay() === 0 && i === sche.length - 1) {
                const timeDiff = Math.floor(today.getTime() - startdate.getTime());
                const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                const week = Math.floor(diffDays / 7);

                const monday = tomorrow;

                const sche = [];

                for (let i = 1; i < Tasks.length; i++) {
                    const task = Tasks[i];
                    const taskSche = task.sch[week];

                    if (taskSche !== '-' && taskSche !== undefined) {
                        if (task.dow === 'Hai') {
                            tiet(task.start, task, task.th);
                            task.date = monday.toDateString();
                            sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
                        }
                    }
                }

                // Hiển thị lịch học của ngày mai (thứ hai) nếu hôm nay là chủ nhật (nếu có)
                for (let i = 0; i < sche.length; i++) {
                    if (z === 0 && sche[i].split('\n')[0] === tomorrow.toDateString()) {
                        const tb = document.createElement('div');
                        tb.classList.add('sch');
                        tb.innerHTML += `
                            <p>- Time: ${sche[i].split('\n')[1]} ${sche[i].split('\n')[4] !== '' ? " (Thực Hành)" : ""}
                            <p>- Name: ${sche[i].split('\n')[2]}
                            <p>- Room: ${sche[i].split('\n')[3]}
                        `;
                        document.querySelector('.noti_box').appendChild(tb);
                        check = 1;
                        if (i === sche.length - 1) z = 1;
                    }
                }
            }

            // Không phải chủ nhật
            else {
                // Hiển thị lịch học của ngày mai với các ngày thứ bình thường
                if (z === 0 && sche[i].split('\n')[0] === tomorrow.toDateString()) {
                    const tb = document.createElement('div');
                    tb.classList.add('sch');
                    tb.innerHTML += `
                            <p>- Time: ${sche[i].split('\n')[1]} ${sche[i].split('\n')[4] !== '' ? " (Thực Hành)" : ""}
                            <p>- Name: ${sche[i].split('\n')[2]}
                            <p>- Room: ${sche[i].split('\n')[3]}
                        `;
                    document.querySelector('.noti_box').appendChild(tb);
                    check = 1;
                    if (i === sche.length - 1) z = 1;
                }
            }
        }

        // Nếu ngày mai không có lịch
        if (z === 0 && !check) {
            const tb = document.createElement('div');
            tb.classList.add('sch');
            tb.innerHTML = `
                    <h3>Ngày mai không có lịch học.</h3>
                `;
            document.querySelector('.noti_box').appendChild(tb);
            z = 1;
        }
    }

    // Nếu tuần hiện tại không có lịch
    else {
        check = 0;
        const taskElement = document.createElement('div');
        taskElement.classList.add("thisweek");
        taskElement.innerHTML = `
            <h2>[ ${monday.toDateString()} - ${sunday.toDateString()} ]</h2><br><br>
            <h3>Hiện không có lịch học nào mới.</h3>
            `;
        document.querySelector('.taskList').appendChild(taskElement);

        // Nếu hôm nay là chủ nhật, kiểm tra ngày mai (thứ hai) có lịch học không 
        if (today.getDay() === 0) {
            const timeDiff = Math.floor(today.getTime() - startdate.getTime());
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const week = Math.floor(diffDays / 7);

            const monday = tomorrow;

            const sche = [];

            for (let i = 1; i < Tasks.length; i++) {
                const task = Tasks[i];
                const taskSche = task.sch[week];

                if (taskSche !== '-' && taskSche !== undefined) {
                    if (task.dow === 'Hai') {
                        tiet(task.start, task, task.th);
                        task.date = monday.toDateString();
                        sche.push(task.date + '\n' + task.time + '\n' + task.name + '\n' + task.room + '\n' + task.th);
                    }
                }
            }

            // Hiển thị lịch học của ngày mai (thứ hai) nếu hôm nay là chủ nhật (nếu có)
            for (let i = 0; i < sche.length; i++) {
                if (z === 0 && sche[i].split('\n')[0] === tomorrow.toDateString()) {
                    const tb = document.createElement('div');
                    tb.classList.add('sch');
                    tb.innerHTML += `
                        <p>- Time: ${sche[i].split('\n')[1]} ${sche[i].split('\n')[4] !== '' ? " (Thực Hành)" : ""}
                        <p>- Name: ${sche[i].split('\n')[2]}
                        <p>- Room: ${sche[i].split('\n')[3]}
                    `;
                    document.querySelector('.noti_box').appendChild(tb);
                    check = 1;
                    if (i === sche.length - 1) z = 1;
                }
            }
        }

        // Hiển thị ngày mai không có lịch
        if (z === 0 && !check) {
            const tb = document.createElement('div');
            tb.classList.add('sch');
            tb.innerHTML = `
                    <h3>Ngày mai không có lịch học.</h3>
                `;
            document.querySelector('.noti_box').appendChild(tb);
            z = 1;
        }
    }

    // Hiển thị thông báo về lịch học ngày mai (nếu có)
    const lastAlertDate = new Date(localStorage.getItem('lastAlertDate'));
    if (today.toDateString() !== lastAlertDate.toDateString()) {
        localStorage.setItem('numAlertsShown', 0);
    }

    const numAlertsShown = parseInt(localStorage.getItem('numAlertsShown')) || 0;
    const maxAlertsPerDay = 1;

    if (numAlertsShown < maxAlertsPerDay) {
        if (document.querySelector('.sch').textContent.trim() !== 'Ngày mai không có lịch học.') {
            chrome.notifications.create('lich_hoc', {
                type: 'basic',
                iconUrl: 'icon/sche.png',
                title: 'THÔNG BÁO LỊCH HỌC',
                message: 'Bạn có lịch học vào ngày mai.\nClick vào Thông báo để xem chi tiết.'
            });
            localStorage.setItem('numAlertsShown', numAlertsShown + 1);
            localStorage.setItem('lastAlertDate', today);
        }
    }
}

// Hiển thị thông báo mới nhất của Học viện
function News(text) {
    document.querySelector('.headn').innerHTML = `Thông báo mới nhất của Học Viện:`;
    const tb = document.createElement('div');
    tb.classList.add('new')
    tb.innerHTML += ` <br> ${text.split('|')[1]} <br>`;
    const t = [];
    for (let i = 0; i < text.split('|')[2].split('\n').length; i++) {
        if (text.split('|')[2].split('\n')[i] !== '')
            t.push(text.split('|')[2].split('\n')[i]);
    }
    for (let i = 0; i < t.length; i++) {
        tb.innerHTML += `
            <br><p style = 'font-weight: 500;'>${t[i]}</p>
        `;
    }
    document.querySelector('.news_box').appendChild(tb);
}

// Hiển thị lịch thi trong kì học (nếu có)
function Tests(test, HK) {
    const storedtasks = localStorage.getItem('tasks');
    const tasks = JSON.parse(storedtasks);

    // Ngày bắt đầu kì học đang xét
    var st = new Date(tasks[0].id.slice(3, 6) + tasks[0].id.slice(0, 3) + tasks[0].id.slice(6))

    const td = today.getDate().toString().padStart(2, '0') + '/'
        + (today.getMonth() + 1).toString().padStart(2, '0') + '/'
        + today.getFullYear()
    const tmr = tomorrow.getDate().toString().padStart(2, '0') + '/'
        + (tomorrow.getMonth() + 1).toString().padStart(2, '0') + '/'
        + tomorrow.getFullYear()

    // Kiểm tra xem lịch thi của kì trước hay của kì này
    if (test.split('\n')[0] === HK || (test.split('\n'[0] !== HK) && today - st < 0)) {
        document.querySelector('.headt').innerHTML = `Lịch thi: ${test.split('\n')[0]}`;
        const tb = document.createElement('div');
        tb.classList.add('test');
        document.querySelector('.test_box').appendChild(tb);
        const t = [];
        for (let i = 0; i < test.split('\n').length - 1; i++) {
            t.push(test.split('\n')[i]);
        }
        for (let i = 1; i < t.length; i++) {
            const ed = document.createElement('div');
            ed.classList.add('test_i')
            ed.id = 'test_' + i
            ed.innerHTML += `
                <h3>Ngày thi: ${t[i].split('|')[1]}</h3>
                <p style = 'font-weight: 500;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Môn: ${t[i].split('|')[0]}
                <p style = 'font-weight: 500;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Giờ bắt đầu: ${t[i].split('|')[2]}
                <p style = 'font-weight: 500;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Số phút: ${t[i].split('|')[3]}
                <p style = 'font-weight: 500;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Phòng: ${t[i].split('|')[4]}
                <p style = 'font-weight: 500;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Ghi chú: ${t[i].split('|')[5]}
            `;
            document.querySelector('.test').appendChild(ed);

            // Bôi vàng lịch thi của ngày ngày mai (nếu có)
            if (t[i].split('|')[1] === tmr) {
                document.getElementById('test_' + i).style.backgroundColor = 'yellow';

                // Tạo thông báo trên trình duyệt rằng ngày mai có lịch thi
                const lastAlertDate_test = new Date(localStorage.getItem('lastAlertDate_test'));
                if (today.toDateString() !== lastAlertDate_test.toDateString()) {
                    localStorage.setItem('numAlertsShown_test', 0);
                }

                const numAlertsShown_test = parseInt(localStorage.getItem('numAlertsShown_test')) || 0;
                const maxAlertsPerDay_test = 1;

                if (numAlertsShown_test < maxAlertsPerDay_test) {
                    chrome.notifications.create('lich_thi', {
                        type: 'basic',
                        iconUrl: 'icon/sche.png',
                        title: 'THÔNG BÁO LỊCH THI',
                        message: `Bạn có lịch thi môn "${t[i].split('|')[0]}" vào "${t[i].split('|')[2]}" ngày mai tại phòng "${t[i].split('|')[4]}".\nClick vào Thông báo để xem chi tiết.`
                    });
                    localStorage.setItem('numAlertsShown_test', numAlertsShown_test + 1);
                    localStorage.setItem('lastAlertDate_test', today);
                }
            }

            // Bôi xanh lịch thi hôm nay
            else if (t[i].split('|')[1] === td)
                document.getElementById('test_' + i).style.backgroundColor = 'aquamarine';
        }
    }
    // Không phải lịch thi kì này
    else {
        document.querySelector('.headt').innerHTML = `Lịch thi: ${HK}`;
        const tb = document.createElement('div');
        tb.classList.add('test');
        tb.innerHTML += `
            <br><p>Hiện chưa có lịch thi của kì học này.</p>
        `;
        document.querySelector('.test_box').appendChild(tb);
    }

}

// Thực hiện khi mở extension ...
document.addEventListener('DOMContentLoaded', function () {
    const storedName = localStorage.getItem('name');
    const name = JSON.parse(storedName);

    const storedTest = localStorage.getItem('test');
    const test = JSON.parse(storedTest);

    const storedHK = localStorage.getItem('HK');
    const HK = JSON.parse(storedHK);

    const storedtasks = localStorage.getItem('tasks');
    const tasks = JSON.parse(storedtasks);

    document.querySelector('.td').innerHTML = `Hôm nay: ${today.toDateString()}`;

    // Nếu có thông tin sinh viên và thông báo
    if (name !== null) {
        document.getElementById("demo").innerHTML = name.split('|')[0];

        // Hiển thị thông báo mới
        News(name);

        // Hiển thị lịch thi
        Tests(test, HK);

        document.querySelector('.icon_noti').style.display = 'flex';
        document.querySelector('.icon_test').style.display = 'flex';
        document.querySelector('.icon_news').style.display = 'flex';
        document.querySelector('.logout').style.display = 'flex';
        document.querySelector(".text1").style.display = "none";
        document.querySelector(".text2").style.display = "none";
        document.getElementById("demo").style.marginRight = "200px";
        document.getElementById("demo").style.fontSize = "1em";
    }

    // Nếu có danh sách lịch học của kì 
    if (tasks !== null) {
        // Hiển thị lịch học của tuần hiện tại
        getData(thisweek);
    }
    else pnday.classList.add('active-popup');

    // Hiển thị đồng hồ
    updateTime();
    setInterval(updateTime);

    // Lấy ra trạng thái nút tự động cập nhật được lưu trong ls
    const toggle = document.getElementById("toggle");
    const toggleState = localStorage.getItem("toggleState");

    var tbao = '0', lthi = '0', lhoc = '0';

    // Tự động cập nhật dữ liệu 
    if (toggleState === '1') {
        toggle.checked = true;

        const storedCheck = localStorage.getItem('check');

        if (tasks !== null && storedCheck === '1') {
            document.getElementById('tlb').style.display = 'flex';
            document.getElementById('lb').style.display = 'flex';

            // Đăng xuất trước cho chắc
            chrome.tabs.create({ url: "https://qldt.ptit.edu.vn/default.aspx?page=dangnhap", active: false });

            chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                const lastTab = tabs[tabs.length - 1];

                chrome.scripting.executeScript({
                    target: { tabId: lastTab.id },
                    func: () => {
                        var theForm = document.forms['aspnetForm'];
                        if (!theForm) {
                            theForm = document.aspnetForm;
                        }

                        function __doPostBack(eventTarget, eventArgument) {
                            if (!theForm.onsubmit || (theForm.onsubmit() != false)) {
                                theForm.__EVENTTARGET.value = eventTarget;
                                theForm.__EVENTARGUMENT.value = eventArgument;
                                theForm.submit();
                            }
                        }

                        __doPostBack('ctl00$Header1$Logout1$lbtnLogOut', '');
                    }
                });
            });

            setTimeout(() => { // Đợi 2s đăng xuất xong
                // Sử dụng tk,mk đang dùng ext
                const storedUser_now = localStorage.getItem('user_now');
                const user_now = JSON.parse(storedUser_now);

                // Đẩy thông tin vào bg
                if (user_now !== null) {
                    let us_n = user_now.username + " " + atob(user_now.password);
                    chrome.runtime.sendMessage({
                        method: "send", key: "key", value: us_n
                    }, () => { });
                }

                // Tìm trang vừa được mở lên
                chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                    const lastTab = tabs[tabs.length - 1];
                    chrome.scripting.executeScript({
                        target: { tabId: lastTab.id },
                        // Đăng nhập vào qldt
                        func: Send
                    });
                });

                // Lấy thông tin sinh viên và thông báo mới nhất của học viện (nếu có)
                setTimeout(() => { // Đợi 4s để hoàn thành đăng nhập
                    chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                        const lastTab = tabs[tabs.length - 1];

                        chrome.scripting.executeScript({
                            target: { tabId: lastTab.id },
                            func: () => {
                                var text1 = '', text2 = '';
                                // Lấy tiêu đề của thông báo (nếu có)
                                const tt = document.querySelector('.TextTitle');
                                if (tt !== null) {
                                    text1 = tt.innerText.replaceAll('\xa0', '');
                                }
                                // Lấy nội dung của thông báo (nếu có)
                                const ttt = document.querySelector('.TextThongTin');
                                if (ttt !== null) {
                                    text2 = ttt.innerText.replaceAll('\xa0', '');
                                }

                                // Lấy tên và mã sv 
                                var nameU = document.getElementById("ctl00_Header1_Logout1_lblNguoiDung").textContent;

                                if (text1 !== '' && text2 !== '')
                                    nameU += "|" + text1 + "|" + text2;

                                // Đưa chuỗi thông tin vào bg
                                chrome.runtime.sendMessage({
                                    method: "send", key: "key", value: nameU
                                }, () => { });
                            }
                        });

                        // Chuyển sang link thời khóa biểu dạng cá nhân
                        chrome.tabs.update(lastTab.id, { url: "https://qldt.ptit.edu.vn/default.aspx?page=thoikhoabieu&sta=1" });
                    });

                    // Lấy tên sv và tbao từ bg về ext, lấy ttin kì hiện tại
                    setTimeout(() => { // Đợi 2s để bg có dữ liệu
                        // Lấy thông tin từ bg
                        chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                            let text = response.value;

                            const storedName = localStorage.getItem('name');
                            const name = JSON.parse(storedName);

                            // Nếu tbao khác tbao trong ls
                            if (text !== name) {
                                localStorage.setItem('name', JSON.stringify(text));
                                tbao = '1';
                            }

                            // Chuyển sang xem tkb được xếp theo tiết và lấy tên học kì hiện tại rồi ném vào bg
                            chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                const lastTab = tabs[tabs.length - 1];

                                chrome.scripting.executeScript({
                                    target: { tabId: lastTab.id },
                                    func: () => {
                                        document.getElementById('ctl00_ContentPlaceHolder1_ctl00_rad_ThuTiet').click();
                                        const selectElement = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_ddlChonNHHK');
                                        const selectedValue = selectElement.options[selectElement.selectedIndex].textContent;
                                        chrome.runtime.sendMessage({
                                            method: "send", key: "key", value: selectedValue
                                        }, () => { });
                                    }
                                });
                            });

                            // Lấy tkb chuyển tới bg
                            setTimeout(() => { // Đợi 2s để bg có dữ liệu
                                chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                    const lastTab = tabs[tabs.length - 1];

                                    const storedHK = localStorage.getItem('HK');
                                    const HK = JSON.parse(storedHK);

                                    // Lấy kì học từ bg
                                    chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                                        if (response.value !== HK) {
                                            localStorage.setItem('HK', JSON.stringify(response.value));
                                        }
                                    });

                                    chrome.scripting.executeScript({
                                        target: { tabId: lastTab.id },
                                        func: () => {
                                            var tables = document.getElementsByClassName("body-table");

                                            // Lấy ttin ngày bắt đầu kì học
                                            const note = document.getElementById("ctl00_ContentPlaceHolder1_ctl00_lblNote").textContent;
                                            var tkb = note.split(' ')[34].substring(0, note.split(' ')[34].length - 1) + '\n';

                                            // Xét từng hàng
                                            for (var i = 0; i < tables.length; i++) {
                                                var table = tables[i];
                                                var dt = '';

                                                for (var j = 0; j < table.rows.length; j++) {
                                                    var row = table.rows[j];

                                                    // Lấy thông tin các ô có mã, tên, th.hanh, thứ, tiết bd, phòng và các tuần có lịch
                                                    for (var k = 0; k < row.cells.length - 1; k++) {
                                                        if ([0, 1, 7, 8, 9, 11, 13].includes(k)) {
                                                            var cell = row.cells[k];
                                                            var cellData = "";

                                                            var div = cell.querySelector("div");
                                                            if (div !== null) {
                                                                cellData = div.textContent;
                                                            } else {
                                                                cellData = cell.textContent;
                                                            }

                                                            dt += cellData + "|";
                                                        }
                                                    }
                                                }
                                                tkb += dt + "\n";
                                            }

                                            chrome.runtime.sendMessage({
                                                method: "send", key: "key", value: tkb
                                            }, () => { });

                                            // Chuyển tới trang lịch thi
                                            document.getElementById('ctl00_menu_lblXemLichThi').click();
                                        }
                                    });
                                });

                                // Lấy tkb từ bg về ext
                                setTimeout(() => { // Đợi 2s để bg có dữ liệu
                                    chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                                        let tkb = response.value;
                                        let count = 0;

                                        for (let i = 0; i < tkb.length; i++) {
                                            if (tkb.charAt(i) === '\n') {
                                                count++;
                                            }
                                        }

                                        let taskss = [];

                                        for (let i = 0; i < count; i++) {
                                            const t = tkb.split('\n')[i].split('|');
                                            const task = {
                                                id: t[0],
                                                name: t[1],
                                                th: t[2],
                                                dow: t[3],
                                                start: t[4],
                                                room: t[5],
                                                sch: t[6]
                                            }
                                            taskss.push(task);
                                        }

                                        const storedtasks = localStorage.getItem('tasks');
                                        const tasks = JSON.parse(storedtasks);

                                        if (taskss !== tasks) {
                                            localStorage.setItem('tasks', JSON.stringify(taskss));
                                            if (taskss[1] !== undefined) {
                                                lhoc = '1';
                                            }
                                        }

                                        // Lấy lịch thi gửi tới bg
                                        chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                            const lastTab = tabs[tabs.length - 1];

                                            chrome.scripting.executeScript({
                                                target: { tabId: lastTab.id },
                                                func: () => {
                                                    var table = document.querySelector('.grid-view')

                                                    const selectElement = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_dropNHHK');
                                                    const selectedValue = selectElement.options[selectElement.selectedIndex].textContent;

                                                    var test = selectedValue + '\n';

                                                    for (var j = 1; j < table.rows.length; j++) {
                                                        dt = ''
                                                        var row = table.rows[j];

                                                        for (var k = 0; k < row.cells.length - 1; k++) {
                                                            if ([2, 6, 7, 8, 9, 10].includes(k)) {
                                                                var cell = row.cells[k];
                                                                var cellData = "";

                                                                var span = cell.querySelector("span");
                                                                if (span !== null) {
                                                                    cellData = span.textContent;
                                                                } else {
                                                                    cellData = cell.textContent;
                                                                }

                                                                dt += cellData + "|";
                                                            }
                                                        }
                                                        test += dt + "\n";
                                                    }

                                                    chrome.runtime.sendMessage({
                                                        method: "send", key: "key", value: test
                                                    }, () => { });
                                                }
                                            });
                                        });
                                    });

                                    // Lấy lịch thi từ bg về ext
                                    setTimeout(() => { // Đợi 2s để bg có dữ liệu
                                        const storedTest = localStorage.getItem('test');
                                        const tests = JSON.parse(storedTest);

                                        const storedHK = localStorage.getItem('HK');
                                        const HK = JSON.parse(storedHK);

                                        chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                                            let test = response.value;
                                            if (test !== tests) {
                                                localStorage.setItem('test', JSON.stringify(test));
                                                lthi = '1';
                                            }
                                        });

                                        // Đóng tab qldt
                                        chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                            const lastTab = tabs[tabs.length - 1];
                                            chrome.tabs.remove(lastTab.id);
                                        });

                                        localStorage.setItem('check', 0);

                                        setTimeout(() => {
                                            localStorage.setItem('tbao', tbao + lhoc + lthi);
                                            document.getElementById('refresh').click();
                                        }, 2000);
                                    }, 3000);
                                }, 3000);
                            }, 3000)
                        });
                    }, 3000);
                }, 4000);
            }, 5000);
        }
    }

    // Không tự động cập nhật ... 
    else toggle.checked = false;

    localStorage.setItem('check', 1);

    // Hiển thị tbao trên trình duyệt sau khi cập nhật tự động
    if (localStorage.getItem('tbao') !== null) {
        let tb = localStorage.getItem('tbao');

        if (tb[0] === '1') {
            chrome.notifications.create('th_bao', {
                type: 'basic',
                iconUrl: 'icon/sche.png',
                title: 'THÔNG BÁO MỚI',
                message: `Bạn có một thông báo mới từ Học Viện.\nClick vào Thông báo để xem chi tiết.`
            });
        }
        if (tb[1] === '1') {
            chrome.notifications.create('lich_hoc_moi', {
                type: 'basic',
                iconUrl: 'icon/sche.png',
                title: 'THÔNG BÁO LỊCH HỌC MỚI',
                message: `Bạn có lịch học mới của ${HK}.`
            });
        }
        if (tb[2] === '1') {
            chrome.notifications.create('lich_thi_new', {
                type: 'basic',
                iconUrl: 'icon/sche.png',
                title: 'THÔNG BÁO LỊCH THI MỚI',
                message: `Bạn có lịch thi mới trong ${test.split('\n')[0]}.\nClick vào Thông báo để xem chi tiết.`
            });
        }

        localStorage.removeItem('tbao');
    }
});

// Tương tác với thông báo của trình duyệt
chrome.notifications.onClicked.addListener(function (notificationId) {
    // Hiển thị popup xem lịch học ngày mai
    if (notificationId === 'lich_hoc') {
        if (notipopup.classList.contains('active-popup')) {
            notipopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        else {
            if (testpopup.classList.contains('active-popup')) {
                testpopup.classList.remove('active-popup');
                document.querySelector('.overlay').remove();
            }
            if (newspopup.classList.contains('active-popup')) {
                newspopup.classList.remove('active-popup');
                document.querySelector('.overlay').remove();
            }
            notipopup.classList.add('active-popup');
            var overlay = document.createElement('div');
            overlay.classList.add('overlay');
            document.body.appendChild(overlay);
        }
    }

    // Hiển thị popup xem lịch thi 
    else if (notificationId === 'lich_thi' || notificationId === 'lich_thi_new') {
        if (testpopup.classList.contains('active-popup')) {
            testpopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        else {
            if (notipopup.classList.contains('active-popup')) {
                notipopup.classList.remove('active-popup');
                document.querySelector('.overlay').remove();
            }
            if (newspopup.classList.contains('active-popup')) {
                newspopup.classList.remove('active-popup');
                document.querySelector('.overlay').remove();
            }
            testpopup.classList.add('active-popup');
            var overlay = document.createElement('div');
            overlay.classList.add('overlay');
            document.body.appendChild(overlay);
        }
    }

    // Hiển thị popup xem thông báo
    else if (notificationId === 'th_bao') {
        if (newspopup.classList.contains('active-popup')) {
            newspopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        else {
            if (testpopup.classList.contains('active-popup')) {
                testpopup.classList.remove('active-popup');
                document.querySelector('.overlay').remove();
            }
            if (notipopup.classList.contains('active-popup')) {
                notipopup.classList.remove('active-popup');
                document.querySelector('.overlay').remove();
            }
            newspopup.classList.add('active-popup');
            var overlay = document.createElement('div');
            overlay.classList.add('overlay');
            document.body.appendChild(overlay);
        }
    }
});

// Tương tác với nút hiển thị giao diện nhập thông tin đăng nhập
btnPopup.addEventListener('click', () => {
    const storedUser = localStorage.getItem('user');
    const user = JSON.parse(storedUser);

    const storedtasks = localStorage.getItem('tasks');
    const tasks = JSON.parse(storedtasks);

    // Nếu chưa đăng nhập mà click vào nút
    if (tasks === null) {
        if (wrapper.classList.contains('active-popup')
            && intro.classList.contains('active-popup')
            && tl.classList.contains('active-popup')) {
            wrapper.classList.remove('active-popup');
            intro.classList.remove('active-popup');
            tl.classList.remove('active-popup');
        }
        else {
            intro.classList.add('active-popup');
            wrapper.classList.add('active-popup');
            tl.classList.add('active-popup');
            // Lấy thông tin tài khoản đã lưu trong localstorage
            if (user !== null) {
                un.value = user.username;
                pw.value = atob(user.password);
                if (!btnRmb.checked) btnRmb.click();
            }
        }
    }
    // Nếu đã đăng nhập mà bấm vào nút
    else {
        alert('Hãy Logout trước khi Login!');
    }
});

// Tương tác với nút Đăng nhập ... (lấy tất cả các dữ liệu cần thiết)
btnLogin.addEventListener('click', (e) => {
    e.preventDefault();

    // Lưu thông tin sv nếu tích "Remmember me" và đã nhập tài khoản, mật khẩu
    if (btnRmb.checked && un.value != "" && pw.value != "") {
        const encodedPassword = btoa(pw.value);

        const user = {
            username: un.value,
            password: encodedPassword
        };
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Nếu có đầy đủ thông tin đăng nhập ...
    if (un.value != "" && pw.value != "") {
        const encodedPassword = btoa(pw.value);

        const user_now = {
            username: un.value,
            password: encodedPassword
        };
        // Lưu thông tin sv đang sử dụng
        localStorage.setItem('user_now', JSON.stringify(user_now));

        var spinner = document.createElement("div");
        var overlay = document.createElement('div');

        overlay.classList.add('overlay');
        spinner.classList.add("spinner");

        document.body.appendChild(overlay);
        document.body.appendChild(spinner);

        // Đẩy thông tin vào bg
        Receive();

        // Mở trang đăng nhập qldt
        chrome.tabs.create({ url: "https://qldt.ptit.edu.vn/default.aspx?page=dangnhap", active: false });

        // Tìm trang vừa được mở lên
        chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
            const lastTab = tabs[tabs.length - 1];
            chrome.scripting.executeScript({
                target: { tabId: lastTab.id },
                // Đăng nhập vào qldt
                func: Send
            });
        });

        // Lấy thông tin sinh viên và thông báo mới nhất của học viện (nếu có)
        setTimeout(() => { // Đợi 4s để hoàn thành đăng nhập
            chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                const lastTab = tabs[tabs.length - 1];

                chrome.scripting.executeScript({
                    target: { tabId: lastTab.id },
                    func: () => {
                        var text1 = '', text2 = '';
                        // Lấy tiêu đề của thông báo (nếu có)
                        const tt = document.querySelector('.TextTitle');
                        if (tt !== null) {
                            text1 = tt.innerText.replaceAll('\xa0', '');
                        }
                        // Lấy nội dung của thông báo (nếu có)
                        const ttt = document.querySelector('.TextThongTin');
                        if (ttt !== null) {
                            text2 = ttt.innerText.replaceAll('\xa0', '');
                        }

                        // Lấy tên và mã sv 
                        var nameU = document.getElementById("ctl00_Header1_Logout1_lblNguoiDung").textContent;

                        if (text1 !== '' && text2 !== '')
                            nameU += "|" + text1 + "|" + text2;

                        // Đưa chuỗi thông tin vào bg
                        chrome.runtime.sendMessage({
                            method: "send", key: "key", value: nameU
                        }, () => { });
                    }
                });

                // Chuyển sang link thời khóa biểu dạng cá nhân
                chrome.tabs.update(lastTab.id, { url: "https://qldt.ptit.edu.vn/default.aspx?page=thoikhoabieu&sta=1" });
            });

            // Lấy tên sv và tbao từ bg về ext, lấy ttin kì hiện tại
            setTimeout(() => { // Đợi 2s để bg có dữ liệu
                // Lấy thông tin từ bg
                chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                    let text = response.value;

                    // Nếu có ttin sv (đúng thông tin đăng nhập)
                    if (text.split('|')[0] !== 'Chào bạn ') {
                        localStorage.setItem('name', JSON.stringify(text));
                        document.getElementById("demo").innerHTML = text.split('|')[0];

                        // Xóa thông báo cũ của hvien
                        if (document.querySelector('.new')) {
                            document.querySelector('.new').remove();
                        }

                        // Hiển thị thông báo mới nhất
                        News(text);

                        document.querySelector('.icon_noti').style.display = 'flex';
                        document.querySelector('.icon_test').style.display = 'flex';
                        document.querySelector('.icon_news').style.display = 'flex';
                        document.querySelector('.logout').style.display = 'flex';
                        document.querySelector(".text1").style.display = "none";
                        document.querySelector(".text2").style.display = "none";
                        document.getElementById("demo").style.marginRight = "200px";
                        document.getElementById("demo").style.fontSize = "1em";

                        // Chuyển sang xem tkb được xếp theo tiết và lấy tên học kì hiện tại rồi ném vào bg
                        chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                            const lastTab = tabs[tabs.length - 1];

                            chrome.scripting.executeScript({
                                target: { tabId: lastTab.id },
                                func: () => {
                                    document.getElementById('ctl00_ContentPlaceHolder1_ctl00_rad_ThuTiet').click();
                                    const selectElement = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_ddlChonNHHK');
                                    const selectedValue = selectElement.options[selectElement.selectedIndex].textContent;
                                    chrome.runtime.sendMessage({
                                        method: "send", key: "key", value: selectedValue
                                    }, () => { });
                                }
                            });
                        });

                        // Lấy tkb chuyển tới bg
                        setTimeout(() => { // Đợi 2s để bg có dữ liệu
                            chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                const lastTab = tabs[tabs.length - 1];

                                // Lấy kì học từ bg
                                chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                                    localStorage.setItem('HK', JSON.stringify(response.value));
                                });

                                chrome.scripting.executeScript({
                                    target: { tabId: lastTab.id },
                                    func: () => {
                                        var tables = document.getElementsByClassName("body-table");

                                        // Lấy ttin ngày bắt đầu kì học
                                        const note = document.getElementById("ctl00_ContentPlaceHolder1_ctl00_lblNote").textContent;
                                        var tkb = note.split(' ')[34].substring(0, note.split(' ')[34].length - 1) + '\n';

                                        // Xét từng hàng
                                        for (var i = 0; i < tables.length; i++) {
                                            var table = tables[i];
                                            var dt = '';

                                            for (var j = 0; j < table.rows.length; j++) {
                                                var row = table.rows[j];

                                                // Lấy thông tin các ô có mã, tên, th.hanh, thứ, tiết bd, phòng và các tuần có lịch
                                                for (var k = 0; k < row.cells.length - 1; k++) {
                                                    if ([0, 1, 7, 8, 9, 11, 13].includes(k)) {
                                                        var cell = row.cells[k];
                                                        var cellData = "";

                                                        var div = cell.querySelector("div");
                                                        if (div !== null) {
                                                            cellData = div.textContent;
                                                        } else {
                                                            cellData = cell.textContent;
                                                        }

                                                        dt += cellData + "|";
                                                    }
                                                }
                                            }
                                            tkb += dt + "\n";
                                        }
                                        chrome.runtime.sendMessage({
                                            method: "send", key: "key", value: tkb
                                        }, () => { });

                                        // Chuyển tới trang lịch thi
                                        document.getElementById('ctl00_menu_lblXemLichThi').click();
                                    }
                                });
                            });

                            // Lấy tkb từ bg về ext
                            setTimeout(() => { // Đợi 2s để bg có dữ liệu
                                chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                                    let tkb = response.value;
                                    let count = 0;

                                    for (let i = 0; i < tkb.length; i++) {
                                        if (tkb.charAt(i) === '\n') {
                                            count++;
                                        }
                                    }

                                    for (let i = 0; i < count; i++) {
                                        const t = tkb.split('\n')[i].split('|');
                                        const task = {
                                            id: t[0],
                                            name: t[1],
                                            th: t[2],
                                            dow: t[3],
                                            start: t[4],
                                            room: t[5],
                                            sch: t[6]
                                        }
                                        tasks.push(task);
                                    }

                                    localStorage.setItem('tasks', JSON.stringify(tasks));

                                    // Xóa tkb cũ 
                                    if (document.querySelector('.thisweek'))
                                        document.querySelector('.thisweek').remove();
                                    if (document.querySelector('.sch')) {
                                        const elements = document.querySelectorAll('.sch');
                                        for (let i = 0; i < elements.length; i++)
                                            document.querySelector('.sch').remove();
                                    }

                                    z = 0;

                                    // Hiển thị tkb của tuần chứa ngày được xét
                                    getData(thisweek);

                                    // Lấy lịch thi gửi tới bg
                                    chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                        const lastTab = tabs[tabs.length - 1];

                                        chrome.scripting.executeScript({
                                            target: { tabId: lastTab.id },
                                            func: () => {
                                                var table = document.querySelector('.grid-view')

                                                const selectElement = document.getElementById('ctl00_ContentPlaceHolder1_ctl00_dropNHHK');
                                                const selectedValue = selectElement.options[selectElement.selectedIndex].textContent;

                                                var test = selectedValue + '\n';

                                                for (var j = 1; j < table.rows.length; j++) {
                                                    dt = ''
                                                    var row = table.rows[j];

                                                    for (var k = 0; k < row.cells.length - 1; k++) {
                                                        if ([2, 6, 7, 8, 9, 10].includes(k)) {
                                                            var cell = row.cells[k];
                                                            var cellData = "";

                                                            var span = cell.querySelector("span");
                                                            if (span !== null) {
                                                                cellData = span.textContent;
                                                            } else {
                                                                cellData = cell.textContent;
                                                            }

                                                            dt += cellData + "|";
                                                        }
                                                    }
                                                    test += dt + "\n";
                                                }

                                                chrome.runtime.sendMessage({
                                                    method: "send", key: "key", value: test
                                                }, () => { });
                                            }
                                        });
                                    });
                                });

                                // Lấy lịch thi từ bg về ext
                                setTimeout(() => { // Đợi 2s để bg có dữ liệu
                                    const storedHK = localStorage.getItem('HK');
                                    const HK = JSON.parse(storedHK);

                                    if (document.querySelector('.test')) {
                                        document.querySelector('.test').remove();
                                    }

                                    chrome.runtime.sendMessage({ method: "recv", key: "key" }, (response) => {
                                        let test = response.value;
                                        localStorage.setItem('test', JSON.stringify(test));

                                        // Hiển thị lịch thi
                                        Tests(test, HK);
                                    });

                                    // Chuyển sang gdien hiển thị tkb
                                    if (wrapper.classList.contains('active-popup')
                                        && intro.classList.contains('active-popup')
                                        && pnday.classList.contains('active-popup')
                                        && tl.classList.contains('active-popup')) {
                                        wrapper.classList.remove('active-popup');
                                        intro.classList.remove('active-popup');
                                        pnday.classList.remove('active-popup');
                                        tl.classList.remove('active-popup');
                                    }

                                    document.querySelector('.spinner').remove();
                                    document.querySelector('.overlay').remove();

                                    // Đóng tab qldt
                                    chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                                        const lastTab = tabs[tabs.length - 1];
                                        chrome.tabs.remove(lastTab.id);
                                    });
                                }, 3000);
                            }, 3000);
                        }, 3000);
                    }

                    // Nếu ttin sv sai (không đúng tk, mk)
                    else {
                        document.querySelector('.spinner').remove();
                        document.querySelector('.overlay').remove();

                        alert('Sai thông tin đăng nhập');

                        // Đóng tab qldt
                        chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
                            const lastTab = tabs[tabs.length - 1];
                            chrome.tabs.remove(lastTab.id);
                        });
                    }
                });
            }, 3000);
        }, 6000);
    }
});

// Nút tuần tới
const nd = document.querySelector(".nd");
// Nút tuần trc
const pd = document.querySelector(".pd");

// Ttac để hiển thị lịch tuần trước so với hiện tại
pd.addEventListener("click", function () {
    thisweek.setDate(thisweek.getDate() - 7);
    lastweek = thisweek;
    document.querySelector('.thisweek').remove();
    getData(lastweek);
});

// Ttac để hiển thị lịch tuần tiếp so với hiện tại
nd.addEventListener("click", function () {
    thisweek.setDate(thisweek.getDate() + 7);
    nextweek = thisweek;
    document.querySelector('.thisweek').remove();
    getData(nextweek);
});

// Ttac để hiển thị popup xem lịch học ngày mai
notification.addEventListener('click', () => {
    if (notipopup.classList.contains('active-popup')) {
        notipopup.classList.remove('active-popup');
        document.querySelector('.overlay').remove();
    }
    else {
        if (testpopup.classList.contains('active-popup')) {
            testpopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        if (newspopup.classList.contains('active-popup')) {
            newspopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        notipopup.classList.add('active-popup');
        var overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
    }
});

// Ttac để hiển thị popup xem lịch thi của kì này 
test.addEventListener('click', () => {
    if (testpopup.classList.contains('active-popup')) {
        testpopup.classList.remove('active-popup');
        document.querySelector('.overlay').remove();
    }
    else {
        if (notipopup.classList.contains('active-popup')) {
            notipopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        if (newspopup.classList.contains('active-popup')) {
            newspopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        testpopup.classList.add('active-popup');
        var overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
    }
});

// Ttac để hiển thị popup xem thông báo mới nhất của hv
news.addEventListener('click', () => {
    if (newspopup.classList.contains('active-popup')) {
        newspopup.classList.remove('active-popup');
        document.querySelector('.overlay').remove();
    }
    else {
        if (testpopup.classList.contains('active-popup')) {
            testpopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        if (notipopup.classList.contains('active-popup')) {
            notipopup.classList.remove('active-popup');
            document.querySelector('.overlay').remove();
        }
        newspopup.classList.add('active-popup');
        var overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
    }
});

// Nút đăng xuất (gọi hàm __doPostBack)
logoutBtn.addEventListener('click', () => {
    var spinner = document.createElement("div");
    var overlay = document.createElement('div');

    overlay.classList.add('overlay');
    spinner.classList.add("spinner");

    document.body.appendChild(overlay);
    document.body.appendChild(spinner);

    chrome.tabs.create({ url: "https://qldt.ptit.edu.vn/default.aspx?page=dangnhap", active: false });

    chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
        const lastTab = tabs[tabs.length - 1];

        chrome.scripting.executeScript({
            target: { tabId: lastTab.id },
            func: () => {
                var theForm = document.forms['aspnetForm'];
                if (!theForm) {
                    theForm = document.aspnetForm;
                }

                function __doPostBack(eventTarget, eventArgument) {
                    if (!theForm.onsubmit || (theForm.onsubmit() != false)) {
                        theForm.__EVENTTARGET.value = eventTarget;
                        theForm.__EVENTARGUMENT.value = eventArgument;
                        theForm.submit();
                    }
                }

                __doPostBack('ctl00$Header1$Logout1$lbtnLogOut', '');
            }
        });
    });

    // Xóa ttin cũ 
    setTimeout(() => {
        localStorage.removeItem('name');
        localStorage.removeItem('HK');
        localStorage.removeItem('tasks');
        localStorage.removeItem('test');
        localStorage.removeItem('numAlertsShown');
        localStorage.removeItem('lastAlertDate');
        localStorage.removeItem('numAlertsShown_test');
        localStorage.removeItem('lastAlertDate_test');
        localStorage.removeItem('user_now');

        chrome.tabs.query({ url: "https://qldt.ptit.edu.vn/*" }, (tabs) => {
            const lastTab = tabs[tabs.length - 1];
            chrome.tabs.remove(lastTab.id);
        });

        document.querySelector('.overlay').remove();
        document.querySelector('.spinner').remove();

        document.getElementById('refresh').click();
    }, 1000);
});

// Nút tự động cập nhật ttin
const toggle = document.getElementById("toggle");

// Lưu trạng thái của nút trong localstorage
toggle.addEventListener("change", function () {
    if (this.checked) {
        localStorage.setItem("toggleState", "1");
        localStorage.setItem('check', 1);
    } else {
        localStorage.setItem("toggleState", "0");
    }
});

