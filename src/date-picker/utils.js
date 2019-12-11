import moment from "moment";


const findClosestIndex = (value, list) => {
    const next = list.findIndex(item => value < item.value);
    return next === -1 ? list.length - 1 : Math.max(0, next - 1);
};

const addOneYear = date => {
    return moment(date).add({ year: 1, day: -1 }).endOf("day").toDate();
};

const subtractOneYear = date => {
    return moment(date).subtract({ year: 1, day: -1 }).startOf("day").toDate();
};

export const normalizeMinMaxDates = (date, minimumDate, maximumDate) => {
    if (minimumDate && maximumDate && minimumDate.valueOf() > maximumDate.valueOf()) {
        minimumDate = null;
        maximumDate = null;
    }

    if (!minimumDate) {
        minimumDate = maximumDate && maximumDate.valueOf() < date.valueOf()
            ? subtractOneYear(maximumDate)
            : moment(date).startOf("day").toDate()
            ;
    }

    maximumDate = maximumDate || addOneYear(minimumDate);
    return { minimumDate, maximumDate };
};


export const normalizeDate = (date, minimumDate, maximumDate) => {
    if (minimumDate.valueOf() > date.valueOf())
        date = new Date(minimumDate.valueOf());
    else if (maximumDate.valueOf() < date.valueOf())
        date = new Date(maximumDate.valueOf());
    return date;
};

export const makeAmList = () => {
    return [
        { title: "AM", value: 0 },
        { title: "PM", value: 12 }
    ];
};


export const makeHoursList = (am, leadingZero) => {
    const hours = am
        ? { min: 0, max: 11, title: i => i === 0 ? 12 : i }
        : { min: 0, max: 23 }
        ;
    const result = [];
    for (let i = hours.min; i <= hours.max; i++) {
        const title = hours.title ? hours.title(i) : i;
        result.push({
            title: leadingZero ? `00${title}`.slice(-2) : `${title}`,
            value: i
        });
    }
    return result
};


export const makeMinutesList = minuteInterval => {
    minuteInterval = minuteInterval || 5;
    const result = [];
    for (let i = 0; i < 60; i += minuteInterval || 5) {
        result.push({
            title: `00${i}`.slice(-2),
            value: i
        });
    }
    return result
};

export const makeTimeLists = (minuteInterval, locale) => {
    const localeData = moment.localeData(locale);
    const timeFormat = localeData.longDateFormat("LT");

    // const am = !!timeFormat.match( /a/i ); commented for 24 hours format
    const am = false;

    const leadingZero = !!timeFormat.match(/hh/i);
    return {
        hours: makeHoursList(am, leadingZero),
        minutes: makeMinutesList(minuteInterval),
        am: am && makeAmList()
    }

};

export const timeToIndexes = (date, lists) => {
    const hoursValue = date.getHours();
    const minutesValue = date.getMinutes();

    const am = lists.am ? lists.am.findIndex(({ value }) => value > hoursValue - 12) : -1;
    const hours = findClosestIndex(hoursValue - (am >= 0 ? lists.am[am].value : 0), lists.hours);
    const minutes = findClosestIndex(minutesValue, lists.minutes);
    return {
        am,
        hours,
        minutes
    };
};

export const indexesToValues = (indexes, lists) => {
    const hours = lists.hours[indexes.hours].value + (indexes.am >= 0 ? lists.am[indexes.am].value : 0);
    const minutes = lists.minutes[indexes.minutes].value;

    return {
        hours,
        minutes
    };
};

const formatDate = (date, locale) => {
    const m = moment(date);
    if (locale)
        m.locale(locale);

    return m.format("ddd MMM D");
};

const destructureDate = moment => ({
    year: moment.year(),
    month: moment.month(),
    date: moment.date()
});

export const makeDateList = ({ minimumDate, maximumDate, locale, todayDate, todayTitle }) => {

    todayDate = todayDate || new Date();

    const today = formatDate(todayDate, locale);
    const current = moment(minimumDate).startOf("day");
    const end = moment(maximumDate).startOf("day");

    const result = [];
    do {
        const title = formatDate(current, locale);
        result.push({
            title: title === today ? todayTitle : title,
            value: destructureDate(current)
        });
        current.add({ days: 1 });
    } while (!end.isBefore(current));

    return result;
};


export const dateToIndex = (date, list) => {
    const dateValue = destructureDate(moment(date));
    const dateMonths = dateValue.year * 12 + dateValue.month;
    const index = list.findIndex(({ value: itemValue }) => {
        const itemMonths = itemValue.year * 12 + itemValue.month;
        return dateMonths < itemMonths
            || dateMonths === itemMonths && dateValue.date <= itemValue.date
            ;
    });
    return index === -1 ? list.length - 1 : index;
};
