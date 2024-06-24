const baseId = 'appWFfuIEFdUuUnqv';
const tableIdOrName = 'QuizSheet';
const apiToken = 'patm1G0PlL8LLg0JN.017f7e25a9437e49357222b1bcfeeb80dda332cf0f639c6d06001a7c0a551d0c';

let airtableData = [];

async function fetchAirtableData() {
    try {
        const response = await axios.get(`https://api.airtable.com/v0/${baseId}/${tableIdOrName}`, {
            headers: {
                Authorization: `Bearer ${apiToken}`
            }
        });
        airtableData = response.data.records;
        console.log('Airtable data fetched successfully: ', airtableData);
        loadAirtableData();
    } catch (error) {
        console.error('Error fetching data from Airtable: ', error);
    }
}

function loadAirtableData() {
    console.log('Airtable data loaded: ', airtableData);
}

function getBenefits(industry, businessType) {
    const record = airtableData.find(
        (record) =>
            record.fields.Industry.toLowerCase() === industry.toLowerCase() &&
            record.fields.BusinessType.toLowerCase() === businessType.toLowerCase()
    );
    if (record) {
        return {
            roles: record.fields.Roles.split(', '),
            industryBenefits: record.fields.IndustryBenefits,
            businessTypeBenefits: record.fields.BusinessTypeBenefits,
        };
    }
    return { roles: [], industryBenefits: '', businessTypeBenefits: '' };
}

function nextStep(step) {
    document.querySelector('.form-step.active').classList.remove('active');
    document.getElementById('step' + step).classList.add('active');
}

function prevStep(step) {
    document.querySelector('.form-step.active').classList.remove('active');
    document.getElementById('step' + step).classList.add('active');
}

function selectIndustry(industry) {
    document.getElementById('industry').value = industry;
    populateBusinessTypes(industry);
    nextStep(2);
}

function populateBusinessTypes(industry) {
    const businessTypeSelect = document.getElementById('businessType');
    businessTypeSelect.innerHTML = '';
    const businessTypes = airtableData
        .filter(record => record.fields.Industry.toLowerCase() === industry.toLowerCase())
        .map(record => record.fields.BusinessType);

    businessTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        businessTypeSelect.appendChild(option);
    });
}

async function handleSubmit(event) {
    event.preventDefault(); // Prevent default form submission behavior

    const form = document.getElementById('customQuizForm');
    const formData = new FormData(form);

    const fullName = formData.get('name');
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ');

    const industry = formData.get('industry');
    const businessType = formData.get('businessType');
    const benefits = getBenefits(industry, businessType);

    const data = {
        industry: formData.get('industry'),
        businessType: formData.get('businessType'),
        painPoint: formData.get('painPoint'),
        companySize: formData.get('companySize'),
        firstName,
        lastName,
        email: formData.get('email'),
        phone: formData.get('phone'),
        companyName: formData.get('companyName'),
        roles: benefits.roles.join(', '),
        savingsFull: calculateCostSavings(formData.get('companySize'), 'full'),
        savingsHalf: calculateCostSavings(formData.get('companySize'), 'half'),
        savingsFew: calculateCostSavings(formData.get('companySize'), 'few')
    };

    showReport(firstName, benefits);

    // Submit the form data to Netlify
    try {
        await axios.post(form.action, data);
        console.log('Form submitted to Netlify');
    } catch (error) {
        console.error('Error submitting form to Netlify: ', error);
    }

    // Submit the form data to Zapier
    try {
        await axios.post('https://hooks.zapier.com/hooks/catch/123456/abcdef', data);
        console.log('Form submitted to Zapier');
    } catch (error) {
        console.error('Error submitting form to Zapier: ', error);
    }
}

function showReport(firstName, benefits) {
    const formData = new FormData(document.getElementById('customQuizForm'));

    const industry = formData.get('industry');
    const businessType = formData.get('businessType');
    const painPoint = formData.get('painPoint');
    const companySize = formData.get('companySize');
    const roles = benefits.roles;

    // Mapping pain points to user-friendly strings
    const painPointMapping = {
        more_customers: "getting more customers",
        systemize_operations: "systemizing operations",
        improve_social_media: "improving your social media presence",
        reduce_costs: "reducing costs"
    };

    const readablePainPoint = painPointMapping[painPoint];

    const integrationScore = Math.floor(Math.random() * 11) + 85;

    document.getElementById('report-header').textContent = `Thank you, ${firstName}!`;
    document.getElementById('report-greeting').innerHTML = `
        Dear ${firstName},<br><br>
        Thank you for taking the time to complete our quiz. Based on your responses, we believe that your ${industry} business, specifically in the ${businessType} sector, has immense potential to address the challenge of ${readablePainPoint}.<br><br>
        Here are the key roles you can consider outsourcing to enhance your operations:
    `;

    const rolesList = document.getElementById('report-roles');
    rolesList.innerHTML = '';
    roles.forEach(role => {
        const listItem = document.createElement('li');
        listItem.textContent = role;
        rolesList.appendChild(listItem);
    });

    document.getElementById('report-costSavings-full').textContent = `$${calculateCostSavings(companySize, 'full')}`;
    document.getElementById('report-costSavings-half').textContent = `$${calculateCostSavings(companySize, 'half')}`;
    document.getElementById('report-costSavings-few').textContent = `$${calculateCostSavings(companySize, 'few')}`;
    document.getElementById('integration-score').textContent = `${integrationScore}%`;

    document.getElementById('report-industry-benefits').textContent = benefits.industryBenefits;
    document.getElementById('report-businessType-benefits').textContent = benefits.businessTypeBenefits;

    populateSecondQuizDropdowns(roles);

    document.getElementById('customQuizForm').style.display = 'none';
    document.getElementById('report').classList.add('active');
}

function populateSecondQuizDropdowns(roles) {
    const additionalQuestion1 = document.getElementById('additionalQuestion1');
    const additionalQuestion2 = document.getElementById('additionalQuestion2');

    additionalQuestion1.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        additionalQuestion1.appendChild(option);
    }

    additionalQuestion2.innerHTML = '';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        additionalQuestion2.appendChild(option);
    });

    // Add a few more roles for diversity
    const extraRoles = ['Marketing Specialist', 'Data Analyst', 'Sales Executive'];
    extraRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        additionalQuestion2.appendChild(option);
    });
}

function calculateCostSavings(companySize, tier) {
    let baseSavings = 0;
    switch (companySize) {
        case '1-5':
            baseSavings = 70000;
            break;
        case '5-10':
            baseSavings = 140000;
            break;
        case '10-20':
            baseSavings = 280000;
            break;
        case '20-50':
            baseSavings = 300000;
            break;
        case '50-100':
            baseSavings = 400000;
            break;
        case '100+':
            baseSavings = 500000;
            break;
        default:
            baseSavings = 0;
    }
    switch (tier) {
        case 'full':
            return baseSavings * 1.5;
        case 'half':
            return baseSavings * 1.2;
        case 'few':
            return baseSavings;
        default:
            return baseSavings;
    }
}

fetchAirtableData();

function openModal() {
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

async function handleSecondQuizSubmit(event) {
    event.preventDefault(); // Prevent default form submission behavior

    const form = document.getElementById('secondQuizForm');
    const formData = new FormData(form);

    const additionalData = {
        additionalQuestion1: formData.get('additionalQuestion1'),
        additionalQuestion2: formData.get('additionalQuestion2')
    };

    // Here you can handle the additional quiz data (e.g., send to server, display report, etc.)
    console.log('Second quiz data:', additionalData);

    // Close the modal after submission
    closeModal();

    // Optionally, you can show a thank you message or process the data further
    alert('Thank you for completing the second quiz!');
}

// Attach event listener to handle modal close on click outside of the modal content
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};