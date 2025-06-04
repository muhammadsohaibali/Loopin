// let pages = 1;
// let fetchTimes = 10
// let dataFetched = [];

// async function fetchData() {
//     const res = await fetchAPI(page);
//     const data = await res.json()

//     if (res.ok) {
//         dataFetched.push(data)
//         if (!(pages >= fetchTimes)) {
//             fetchData();
//         } else {
//             console.log(dataFetched)
//         }
//     }
// }

// async function fetchAPI(page) {
//     try {
//         const response = await fetch(`https://batch-api-prod.vercel.app/api/users/students?limit=1500&page=${page}`);
//         if (!response.ok) return null;
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching current user:', error);
//         return null;
//     }
// }

// async function init() {
//     let timeStart = new Date()
//     let timeEnd;

//     await fetchData()

//     timeEnd = new Date();
//     let timeElapsed = timeEnd - timeStart
//     console.log(timeElapsed)
// }

let page = 1;
let fetchTimes = 20;
let dataFetched = [];

async function fetchData() {
    const data = await fetchAPI(page);

    if (data && data.students) {
        dataFetched.push(...data.students); // flatten the array
        console.log(`Fetched Page: ${page}`);
        page++;

        if (page <= fetchTimes) {
            await fetchData();
        } else {
            console.log("All data fetched:", dataFetched);
        }
    } else {
        console.error("Fetch failed on page:", page);
    }
}

async function fetchAPI(page) {
    try {
        const response = await fetch(`https://batch-api-prod.vercel.app/api/users/students?limit=1000&page=${page}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        });

        if (!response.ok) {
            console.error(`Failed fetch. Status: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function init() {
    const start = Date.now();
    await fetchData();
    const end = Date.now();
    console.log(`Total time: ${end - start}ms`);
}

init();
