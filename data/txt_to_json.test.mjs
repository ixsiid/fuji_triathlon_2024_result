import fs from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert';

const records = await fs.readFile('result.manual.txt')
	.then(buffer => buffer.toString())
	.then(text => {
		const lines = text.split('\r\n');

		const data = lines.map(d => {
			const [rank, number, given_name, family_name, sex, locale, ...other] = d.split(' ');

			const last_value = other.pop();
			const is_last_number = !isNaN(parseInt(last_value));
			const [section, section_rank] = (() => {
				if (is_last_number) {
					return [other.pop(), parseInt(last_value)];
				}
				return [last_value];
			})();

			const [
				record,
				swim, swim_rank,
				bike, bike_rank,
				split, split_rank,
				run, run_rank,
				sex_rank
			] = other;

			return {
				rank, number, given_name, family_name, sex, locale, section_rank, section,
				_records: other,
				record, swim, swim_rank, bike, bike_rank, split, split_rank, run, run_rank, sex_rank,
			};
		});

		return data;
	});

records.forEach(x => {
	['record', 'swim', 'bike', 'split', 'run'].forEach(k => {
		const t = x[k].split(':').map(q => parseInt(q));
		x[k + '_sec'] = (t.length === 3) ? t[0] * 3600 + t[1] * 60 + t[2] : undefined;
	});
});

test('Check rank: OPEN, DNF, DNS, TOV, SKIP, DSQ or number', async () => {
	const rank = records.map(d => d.rank);
	const error = rank.find(r => {
		const p = !(['OPEN', 'DNF', 'DNS', 'TOV', 'SKIP', 'DSQ'].includes(r));
		if (p) {
			const n = parseInt(r);
			return isNaN(n);
		}
	});
	assert.notEqual(!!error, true, `rankに予期しない値: ${error}`);
});

test('Check number: number', async () => {
	const number = records.map(d => parseInt(d.number));
	const error = number.find(s => isNaN(s));
	assert.notEqual(!!error, true, `numberに予期しない値: ${error}`);
});

test('Check sex: 男 or 女', async () => {
	const sex = records.map(d => d.sex);
	const error = sex.find(s => {
		return !(['男', '女'].includes(s));
	});
	assert.notEqual(!!error, true, `sexに予期しない値: ${error}`);
});

test('Check section', async () => {
	const section = records.map(d => d.section);
	const error = section.find(s => s.match(/[男女]子[0-9\-]+歳(以上)?/) == null);
	assert.notEqual(!!error, true, `sectionに予期しない値: ${error}`);
});

test('Check section rank', async () => {
	const section_rank = records.map(d => d.section_rank);
	const error = section_rank.find(s => !(s === undefined || (typeof (s) === 'number')));
	assert.notEqual(!!error, true, `section rankに予期しない値: ${error}`);
});

test('Check records: records.length === 10', async () => {
	const error = records.find(x => x._records.length !== 10);
	assert.notEqual(!!error, true, `_recordsの長さがおかしい: ${records.findIndex(x => x == error)} 行目 ${JSON.stringify(error)}`);
});

console.log(records[0]);

fs.writeFile('result.json', JSON.stringify(records));