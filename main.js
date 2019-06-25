const fs = require('fs');
const path = require('path');
const d3 = require('d3-dsv');

const reportNames = fs.readdirSync(path.resolve('../firebase-database-exporter/backups'));

const reports = reportNames.map(report => JSON.parse(fs.readFileSync(path.resolve(`../firebase-database-exporter/backups/${report}`), {encoding: 'utf8'})));

// for each file, grab the timestamp and check if it was run on quizQuestions
// console.log(reports[0].course_id);
let print = true;
const lookFor = [
    'itemCards',
    'issues',
    'issueItems',
    'katanaItems'
]
const data = reports.reduce((acc, report) => {
    // find the correct key where the data is stored on the report
    const itemKey = Object.keys(report).find(reportKey => lookFor.includes(reportKey));

    // if there was a key found
    if (itemKey) {
        const foundCards = report[itemKey].reduce((innerAcc, item) => {
            item = JSON.parse(item);
            // filter to find the item cards that touched quizQuestions
            if (item.category.includes('quizQuestions') && toDateTime(report.timestamp._seconds).getFullYear() === 2019) {
                let quizPath = item.item_path.replace('/api/v1/', '').replace(/\/questions\/\d+/gi,'');
                return innerAcc.concat({
                    id: item.course_id,
                    quizId: item.parent_id,
                    questionId: item.item_id,
                    category: item.category,
                    status: item.status,
                    quizLink: `https://byui.instructure.com/${quizPath}/edit`,
                    date: report.timestamp ? toDateTime(report.timestamp._seconds) : ''
                });
            }
            return innerAcc;
        }, []);
        return acc.concat(foundCards);
    } 
    return acc;
}, []);

// found at https://stackoverflow.com/questions/4611754/javascript-convert-seconds-to-a-date-object/4611809
function toDateTime(secs) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
}

// console.log(data)
const csvData = d3.csvFormat(data);
console.log(csvData)
fs.writeFileSync(path.resolve('./report.csv'), csvData);