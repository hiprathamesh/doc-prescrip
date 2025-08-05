'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import DocPill from '../../components/icons/DocPill';
import CustomDropdown from '../../components/CustomDropdown';

export default function PrivacyPolicy() {
  usePageTitle('Privacy Policy');
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'marathi', label: 'मराठी' },
    { value: 'hindi', label: 'हिन्दी' },
    { value: 'spanish', label: 'Español' },
    { value: 'chinese', label: '中文' }
  ];

  const getContent = () => {
    switch (selectedLanguage) {
      case 'marathi':
        return {
          title: 'गोपनीयता धोरण',
          effectiveDate: 'प्रभावी दिनांक:',
          sections: [
            {
              title: '1. परिचय',
              content: 'डॉक प्रेस्क्रिप ("आम्ही," "आमचे," किंवा "आमचा") आपल्या वैयक्तिक माहिती आणि रुग्ण डेटाची गोपनीयता आणि सुरक्षा संरक्षित करण्यास वचनबद्ध आहे. हे गोपनीयता धोरण स्पष्ट करते की आमच्या वैद्यकीय प्रॅक्टिस व्यवस्थापन प्रणालीचा ("सेवा") वापर करताना आम्ही आपली माहिती कशी गोळा करतो, वापरतो, उघड करतो आणि संरक्षित करतो. हे धोरण आमच्या सेवेच्या सर्व वापरकर्त्यांना लागू होते, ज्यामध्ये आरोग्य व्यावसायिक आणि त्यांचे अधिकृत कर्मचारी यांचा समावेश आहे.'
            },
            {
              title: '2. आम्ही गोळा करत असलेली माहिती',
              content: 'आरोग्य व्यावसायिक माहिती: जेव्हा आपण आमच्या सेवेसाठी नोंदणी करता, तेव्हा आम्ही वैयक्तिक ओळख माहिती (नाव, ईमेल पत्ता, फोन नंबर), व्यावसायिक प्रमाणपत्रे (वैद्यकीय परवाना क्रमांक, पदवी, नोंदणी तपशील), रुग्णालय किंवा क्लिनिक माहिती (नाव, पत्ता, संपर्क तपशील), प्रमाणीकरण माहिती (पासवर्ड, प्रवेश की), प्रोफाइल माहिती आणि प्राधान्ये गोळा करतो. रुग्ण माहिती: आपल्या वैद्यकीय प्रॅक्टिस व्यवस्थापनाचा भाग म्हणून, आमची सेवा रुग्ण लोकसंख्याशास्त्र, वैद्यकीय इतिहास आणि आरोग्य नोंदी, प्रिस्क्रिप्शन डेटा आणि औषध माहिती, निदान माहिती आणि चाचणी परिणाम, बिलिंग आणि पेमेंट माहिती, भेट आणि फॉलो-अप डेटा, वैद्यकीय प्रमाणपत्रे आणि संबंधित दस्तऐवजीकरण प्रक्रिया करते.'
            },
            {
              title: '3. आम्ही आपली माहिती कशी वापरतो',
              content: 'आम्ही गोळा केलेली माहिती खालील उद्देशांसाठी वापरतो: वैद्यकीय प्रॅक्टिस व्यवस्थापन सेवा प्रदान करणे आणि त्यांची देखभाल करणे, प्रिस्क्रिप्शन तयार करणे, रुग्ण रेकॉर्ड व्यवस्थापन आणि बिलिंग फंक्शन्स सक्षम करणे, वैद्यकीय प्रमाणपत्रे आणि इतर आवश्यक दस्तऐवजीकरण तयार करणे, भेट शेड्यूलिंग आणि फॉलो-अप व्यवस्थापनाची सुविधा देणे, डेटा सुरक्षा सुनिश्चित करणे आणि अनधिकृत प्रवेश रोखणे, वापर विश्लेषण आणि अभिप्राय द्वारे आमची सेवा सुधारणे, ग्राहक समर्थन आणि तांत्रिक सहाय्य प्रदान करणे, कायदेशीर आणि नियामक आवश्यकतांचे पालन करणे.'
            },
            {
              title: '4. डेटा स्टोरेज आणि सुरक्षा',
              content: 'स्थानिक स्टोरेज: आमची सेवा प्रामुख्याने डेटा गोपनीयता सुनिश्चित करण्यासाठी आणि बाह्य डेटा ट्रान्समिशन कमी करण्यासाठी आपल्या डिव्हाइसवर स्थानिक स्टोरेज वापरते. याचा अर्थ असा की आपला बहुतेक रुग्ण डेटा आणि प्रॅक्टिस माहिती आपल्या कॉम्प्युटर किंवा डिव्हाइसवर स्थानिकरित्या संग्रहीत केली जाते, ज्यामुळे आपल्याला आपल्या डेटावर थेट नियंत्रण मिळते. सुरक्षा उपाय: आम्ही आपली माहिती संरक्षित करण्यासाठी सर्वसमावेशक सुरक्षा उपाय लागू करतो: संवेदनशील डेटाचे एन्क्रिप्शन, सुरक्षित प्रमाणीकरण प्रोटोकॉल आणि प्रवेश नियंत्रणे, नियमित सुरक्षा ऑडिट आणि भेद्यता मूल्यांकन, गरजेच्या आधारावर डेटामध्ये मर्यादित प्रवेश, सुरक्षित बॅकअप आणि रिकव्हरी प्रक्रिया.'
            },
            {
              title: '5. माहिती सामायिकरण आणि उघडकीस आणणे',
              content: 'आम्ही आपली वैयक्तिक माहिती किंवा रुग्ण डेटा तृतीय पक्षांना विकत नाही, व्यापार करत नाही किंवा अन्यथा हस्तांतरित करत नाही. आम्ही केवळ खालील मर्यादित परिस्थितींमध्ये माहिती उघड करू शकतो: आपल्या स्पष्ट संमतीने, कायदेशीर दायित्वे किंवा न्यायालयीन आदेशांचे पालन करण्यासाठी, आमचे अधिकार, मालमत्ता किंवा सुरक्षा किंवा इतरांची सुरक्षा करण्यासाठी, व्यावसायिक हस्तांतरण किंवा विलीनीकरणाच्या संबंधात (योग्य सुरक्षा उपायांसह), सेवा वितरणात सहाय्य करणाऱ्या अधिकृत सेवा प्रदात्यांना (कठोर गोपनीयता करारांतर्गत).'
            },
            {
              title: '6. आपले अधिकार आणि निवडी',
              content: 'आपल्या माहितीबाबत आपल्याकडे खालील अधिकार आहेत: प्रवेश: आम्ही ठेवलेल्या आपल्या वैयक्तिक माहितीमध्ये प्रवेशाची विनंती, सुधारणा: चुकीच्या किंवा अपूर्ण माहितीच्या सुधारणेची विनंती, हटवणे: आपल्या वैयक्तिक माहितीच्या हटवण्याची विनंती (कायदेशीर आवश्यकतांच्या अधीन), पोर्टेबिलिटी: आपल्या डेटाच्या दुसऱ्या सेवा प्रदात्यांकडे हस्तांतरणाची विनंती, प्रतिबंध: विशिष्ट परिस्थितींमध्ये प्रक्रियेच्या प्रतिबंधाची विनंती, संमतीची माघारी: जेथे लागू असेल तेथे डेटा प्रक्रियेसाठी संमती मागे घेणे.'
            },
            {
              title: '7. HIPAA आणि आरोग्यसेवा अनुपालन',
              content: 'आमची सेवा आरोग्य व्यावसायिकांना रुग्ण गोपनीयता आणि डेटा सुरक्षा राखण्यात मदत करण्यासाठी डिझाइन केलेली असली तरी, लागू आरोग्यसेवा नियमांचे पालन सुनिश्चित करण्याची जबाबदारी आपली राहते, ज्यामध्ये खालीलपैकी काही आहेत परंतु मर्यादित नाहीत: आरोग्य विमा पोर्टेबिलिटी आणि उत्तरदायित्व कायदा (HIPAA) जेथे लागू असेल, स्थानिक आरोग्यसेवा डेटा संरक्षण नियम, वैद्यकीय परवाना बोर्डाच्या आवश्यकता, डेटा प्रक्रियेसाठी रुग्ण संमती आवश्यकता.'
            },
            {
              title: '8. आंतरराष्ट्रीय डेटा हस्तांतरण',
              content: 'आमची सेवा प्रामुख्याने स्थानिक स्टोरेज वापरत असल्याने, आंतरराष्ट्रीय डेटा हस्तांतरण कमीत कमी आहे. तथापि, काही सेवा वैशिष्ट्यांमध्ये वेगवेगळ्या न्यायक्षेत्रांमध्ये डेटा प्रक्रिया समाविष्ट असू शकते. जेव्हा असे हस्तांतरण होते, तेव्हा आम्ही आपली माहिती संरक्षित करण्यासाठी योग्य सुरक्षा उपाय सुनिश्चित करतो.'
            },
            {
              title: '9. मुलांची गोपनीयता',
              content: 'आमची सेवा 18 वर्षाखालील मुलांच्या वापरासाठी नाही. आम्ही जाणूनबुजून 18 वर्षाखालील मुलांकडून वैयक्तिक माहिती गोळा करत नाही. जर आम्हाला कळले की आम्ही 18 वर्षाखालील मुलाकडून वैयक्तिक माहिती गोळा केली आहे, तर आम्ही अशी माहिती हटवण्यासाठी पावले उचलू.'
            },
            {
              title: '10. डेटा भंग अधिसूचना',
              content: 'आपली माहिती धोक्यात आणू शकणाऱ्या डेटा सुरक्षा घटनेच्या संभाव्यता नसलेल्या परिस्थितीत, आम्ही: घटनेची तातडीने आणि कसून तपासणी करू, भंग रोखण्यासाठी आणि कमी करण्यासाठी तात्काळ पावले उचलू, शक्य असल्यास 72 तासांच्या आत प्रभावित वापरकर्त्यांना सूचित करू, घटनेच्या स्वरूप आणि व्याप्तीबद्दल स्पष्ट माहिती प्रदान करू, आपण घेऊ शकणाऱ्या संरक्षणात्मक उपायांबद्दल मार्गदर्शन देऊ, सर्व लागू भंग अधिसूचना आवश्यकतांचे पालन करू.'
            },
            {
              title: '11. तृतीय-पक्ष सेवा',
              content: 'आमची सेवा तृतीय-पक्ष सेवांशी (जसे की Google प्रमाणीकरण, PDF जनरेशन सेवा, किंवा संप्रेषण प्लॅटफॉर्म) एकत्रित होऊ शकते. या तृतीय-पक्ष सेवांची त्यांची स्वतःची गोपनीयता धोरणे आहेत, आणि आम्ही आपल्याला त्यांचे पुनरावलोकन करण्यास प्रोत्साहित करतो. आम्ही या तृतीय-पक्ष सेवांच्या गोपनीयता पद्धतींसाठी जबाबदार नाही.'
            },
            {
              title: '12. या गोपनीयता धोरणाचे अपडेट्स',
              content: 'आम्ही आमच्या पद्धती, तंत्रज्ञान, कायदेशीर आवश्यकता किंवा इतर घटकांमधील बदल प्रतिबिंबित करण्यासाठी वेळोवेळी या गोपनीयता धोरणाचे अपडेट करू शकतो. आम्ही कोणत्याही महत्त्वाच्या बदलांबद्दल आपल्याला सूचित करू: आमच्या सेवेवर अपडेट केलेले धोरण पोस्ट करून, सेवेद्वारे आपल्याला अधिसूचना पाठवून, महत्त्वाच्या बदलांसाठी किमान 30 दिवसांची नोटीस देऊन. अशा सुधारणांनंतर सेवेचा आपला निरंतर वापर अपडेट केलेल्या गोपनीयता धोरणाची स्वीकृती दर्शवते.'
            },
            {
              title: '13. आमच्याशी संपर्क साधा',
              content: 'या गोपनीयता धोरणाबद्दल किंवा आमच्या डेटा पद्धतींबद्दल आपल्याकडे कोणतेही प्रश्न, चिंता किंवा विनंत्या असल्यास, कृपया आमच्याशी संपर्क साधा: अनुप्रयोगाच्या समर्थन आणि अभिप्राय प्रणालीद्वारे, सेवेतील मदत विभागाद्वारे, आमच्या ग्राहक समर्थन चॅनेलद्वारे. आम्ही आपल्या गोपनीयता चिंतांचे निराकरण करण्यास वचनबद्ध आहोत आणि आपल्या चौकशींना वेळेवर प्रतिसाद देऊ.'
            }
          ]
        };
      case 'hindi':
        return {
          title: 'गोपनीयता नीति',
          effectiveDate: 'प्रभावी दिनांक:',
          sections: [
            {
              title: '1. परिचय',
              content: 'डॉक प्रेस्क्रिप ("हम," "हमारे," या "हमारा") आपकी व्यक्तिगत जानकारी और रोगी डेटा की गोपनीयता और सुरक्षा की सुरक्षा के लिए प्रतिबद्ध है। यह गोपनीयता नीति बताती है कि हमारी चिकित्सा अभ्यास प्रबंधन प्रणाली ("सेवा") का उपयोग करते समय हम आपकी जानकारी कैसे एकत्र करते, उपयोग करते, प्रकट करते और सुरक्षित करते हैं। यह नीति हमारी सेवा के सभी उपयोगकर्ताओं पर लागू होती है, जिसमें स्वास्थ्य पेशेवर और उनके अधिकृत कर्मचारी शामिल हैं।'
            },
            {
              title: '2. हम जो जानकारी एकत्र करते हैं',
              content: 'स्वास्थ्य पेशेवर जानकारी: जब आप हमारी सेवा के लिए पंजीकरण करते हैं, तो हम व्यक्तिगत पहचान जानकारी (नाम, ईमेल पता, फोन नंबर), व्यावसायिक प्रमाण पत्र (चिकित्सा लाइसेंस नंबर, डिग्री, पंजीकरण विवरण), अस्पताल या क्लिनिक जानकारी (नाम, पता, संपर्क विवरण), प्रमाणीकरण जानकारी (पासवर्ड, एक्सेस की), प्रोफाइल जानकारी और प्राथमिकताएं एकत्र करते हैं। रोगी जानकारी: आपके चिकित्सा अभ्यास प्रबंधन के भाग के रूप में, हमारी सेवा रोगी जनसांख्यिकी, चिकित्सा इतिहास और स्वास्थ्य रिकॉर्ड, प्रिस्क्रिप्शन डेटा और दवा जानकारी, निदान जानकारी और परीक्षण परिणाम, बिलिंग और भुगतान जानकारी, अपॉइंटमेंट और फॉलो-अप डेटा, चिकित्सा प्रमाण पत्र और संबंधित दस्तावेजीकरण की प्रक्रिया करती है।'
            },
            {
              title: '3. हम आपकी जानकारी का उपयोग कैसे करते हैं',
              content: 'हम एकत्रित जानकारी का निम्नलिखित उद्देश्यों के लिए उपयोग करते हैं: चिकित्सा अभ्यास प्रबंधन सेवाएं प्रदान करना और बनाए रखना, प्रिस्क्रिप्शन निर्माण, रोगी रिकॉर्ड प्रबंधन और बिलिंग कार्यों को सक्षम करना, चिकित्सा प्रमाण पत्र और अन्य आवश्यक दस्तावेजीकरण तैयार करना, अपॉइंटमेंट शेड्यूलिंग और फॉलो-अप प्रबंधन की सुविधा प्रदान करना, डेटा सुरक्षा सुनिश्चित करना और अनधिकृत पहुंच को रोकना, उपयोग विश्लेषण और फीडबैक के माध्यम से हमारी सेवा में सुधार करना, ग्राहक सहायता और तकनीकी सहायता प्रदान करना, कानूनी और नियामक आवश्यकताओं का अनुपालन करना।'
            },
            {
              title: '4. डेटा भंडारण और सुरक्षा',
              content: 'स्थानीय भंडारण: हमारी सेवा मुख्य रूप से डेटा गोपनीयता सुनिश्चित करने और बाहरी डेटा ट्रांसमिशन को कम करने के लिए आपके डिवाइस पर स्थानीय भंडारण का उपयोग करती है। इसका मतलब है कि आपका अधिकांश रोगी डेटा और अभ्यास जानकारी आपके कंप्यूटर या डिवाइस पर स्थानीय रूप से संग्रहीत की जाती है, जिससे आपको अपने डेटा पर प्रत्यक्ष नियंत्रण मिलता है। सुरक्षा उपाय: हम आपकी जानकारी की सुरक्षा के लिए व्यापक सुरक्षा उपाय लागू करते हैं: संवेदनशील डेटा का एन्क्रिप्शन, सुरक्षित प्रमाणीकरण प्रोटोकॉल और पहुंच नियंत्रण, नियमित सुरक्षा ऑडिट और भेद्यता आकलन, आवश्यकता के आधार पर डेटा तक सीमित पहुंच, सुरक्षित बैकअप और रिकवरी प्रक्रियाएं।'
            },
            {
              title: '5. जानकारी साझाकरण और प्रकटीकरण',
              content: 'हम आपकी व्यक्तिगत जानकारी या रोगी डेटा को तीसरे पक्ष को नहीं बेचते, व्यापार नहीं करते या अन्यथा स्थानांतरित नहीं करते। हम केवल निम्नलिखित सीमित परिस्थितियों में जानकारी का खुलासा कर सकते हैं: आपकी स्पष्ट सहमति के साथ, कानूनी दायित्वों या न्यायालय के आदेशों का अनुपालन करने के लिए, हमारे अधिकारों, संपत्ति या सुरक्षा या दूसरों की सुरक्षा के लिए, व्यावसायिक स्थानांतरण या विलय के संबंध में (उपयुक्त सुरक्षा उपायों के साथ), सेवा वितरण में सहायता करने वाले अधिकृत सेवा प्रदाताओं को (सख्त गोपनीयता समझौतों के तहत)।'
            },
            {
              title: '6. आपके अधिकार और विकल्प',
              content: 'आपकी जानकारी के संबंध में आपके निम्नलिखित अधिकार हैं: पहुंच: हमारे पास मौजूद आपकी व्यक्तिगत जानकारी तक पहुंच का अनुरोध, सुधार: गलत या अधूरी जानकारी के सुधार का अनुरोध, हटाना: आपकी व्यक्तिगत जानकारी के हटाने का अनुरोध (कानूनी आवश्यकताओं के अधीन), पोर्टेबिलिटी: आपके डेटा के दूसरे सेवा प्रदाता को स्थानांतरण का अनुरोध, प्रतिबंध: विशिष्ट परिस्थितियों में प्रसंस्करण के प्रतिबंध का अनुरोध, सहमति की वापसी: जहां लागू हो वहां डेटा प्रसंस्करण के लिए सहमति वापस लेना।'
            },
            {
              title: '7. HIPAA और स्वास्थ्य सेवा अनुपालन',
              content: 'हमारी सेवा स्वास्थ्य पेशेवरों को रोगी गोपनीयता और डेटा सुरक्षा बनाए रखने में सहायता के लिए डिज़ाइन की गई है, फिर भी लागू स्वास्थ्य सेवा नियमों का अनुपालन सुनिश्चित करने की जिम्मेदारी आपकी रहती है, जिसमें निम्नलिखित शामिल हैं लेकिन सीमित नहीं हैं: स्वास्थ्य बीमा पोर्टेबिलिटी और जवाबदेही अधिनियम (HIPAA) जहां लागू हो, स्थानीय स्वास्थ्य सेवा डेटा सुरक्षा नियम, चिकित्सा लाइसेंसिंग बोर्ड आवश्यकताएं, डेटा प्रसंस्करण के लिए रोगी सहमति आवश्यकताएं।'
            },
            {
              title: '8. अंतर्राष्ट्रीय डेटा स्थानांतरण',
              content: 'चूंकि हमारी सेवा मुख्य रूप से स्थानीय भंडारण का उपयोग करती है, अंतर्राष्ट्रीय डेटा स्थानांतरण न्यूनतम है। हालांकि, कुछ सेवा सुविधाओं में विभिन्न न्यायक्षेत्रों में डेटा प्रसंस्करण शामिल हो सकता है। जब ऐसा स्थानांतरण होता है, तो हम आपकी जानकारी की सुरक्षा के लिए उपयुक्त सुरक्षा उपाय सुनिश्चित करते हैं।'
            },
            {
              title: '9. बच्चों की गोपनीयता',
              content: 'हमारी सेवा 18 वर्ष से कम उम्र के बच्चों के उपयोग के लिए नहीं है। हम जानबूझकर 18 वर्ष से कम उम्र के बच्चों से व्यक्तिगत जानकारी एकत्र नहीं करते। यदि हमें पता चलता है कि हमने 18 वर्ष से कम उम्र के बच्चे से व्यक्तिगत जानकारी एकत्र की है, तो हम ऐसी जानकारी को हटाने के लिए कदम उठाएंगे।'
            },
            {
              title: '10. डेटा उल्लंघन अधिसूचना',
              content: 'आपकी जानकारी को खतरे में डाल सकने वाली डेटा सुरक्षा घटना की असंभावित स्थिति में, हम: घटना की तुरंत और पूरी तरह से जांच करेंगे, उल्लंघन को रोकने और कम करने के लिए तत्काल कदम उठाएंगे, संभव होने पर 72 घंटों के भीतर प्रभावित उपयोगकर्ताओं को सूचित करेंगे, घटना की प्रकृति और दायरे के बारे में स्पष्ट जानकारी प्रदान करेंगे, आप जो सुरक्षात्मक उपाय ले सकते हैं उसके बारे में मार्गदर्शन प्रदान करेंगे, सभी लागू उल्लंघन अधिसूचना आवश्यकताओं का अनुपालन करेंगे।'
            },
            {
              title: '11. तृतीय-पक्ष सेवाएं',
              content: 'हमारी सेवा तृतीय-पक्ष सेवाओं (जैसे Google प्रमाणीकरण, PDF जनरेशन सेवाएं, या संचार प्लेटफॉर्म) के साथ एकीकृत हो सकती है। इन तृतीय-पक्ष सेवाओं की अपनी गोपनीयता नीतियां हैं, और हम आपको उनकी समीक्षा करने के लिए प्रोत्साहित करते हैं। हम इन तृतीय-पक्ष सेवाओं की गोपनीयता प्रथाओं के लिए जिम्मेदार नहीं हैं।'
            },
            {
              title: '12. इस गोपनीयता नीति के अपडेट',
              content: 'हम अपनी प्रथाओं, प्रौद्योगिकी, कानूनी आवश्यकताओं या अन्य कारकों में बदलावों को दर्शाने के लिए समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। हम किसी भी महत्वपूर्ण बदलाव के बारे में आपको सूचित करेंगे: हमारी सेवा पर अपडेटेड नीति पोस्ट करके, सेवा के माध्यम से आपको अधिसूचना भेजकर, महत्वपूर्ण बदलावों के लिए कम से कम 30 दिनों की सूचना प्रदान करके। ऐसे संशोधनों के बाद सेवा का आपका निरंतर उपयोग अद्यतन की गई गोपनीयता नीति की स्वीकृति का प्रतिनिधित्व करता है।'
            },
            {
              title: '13. हमसे संपर्क करें',
              content: 'यदि इस गोपनीयता नीति या हमारी डेटा प्रथाओं के बारे में आपके कोई प्रश्न, चिंताएं या अनुरोध हैं, तो कृपया हमसे संपर्क करें: एप्लिकेशन की सहायता और फीडबैक प्रणाली के माध्यम से, सेवा के भीतर सहायता अनुभाग के माध्यम से, हमारे ग्राहक सहायता चैनलों के माध्यम से। हम आपकी गोपनीयता चिंताओं का समाधान करने के लिए प्रतिबद्ध हैं और आपकी पूछताछ का समय पर जवाब देंगे।'
            }
          ]
        };
      case 'spanish':
        return {
          title: 'Política de Privacidad',
          effectiveDate: 'Fecha efectiva:',
          sections: [
            {
              title: '1. Introducción',
              content: 'Doc Prescrip ("nosotros," "nuestro," o "nuestra") está comprometido a proteger la privacidad y seguridad de su información personal y datos de pacientes. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza nuestro sistema de gestión de práctica médica ("Servicio"). Esta política se aplica a todos los usuarios de nuestro Servicio, incluyendo profesionales de la salud y su personal autorizado.'
            },
            {
              title: '2. Información que Recopilamos',
              content: 'Información de Profesionales de la Salud: Cuando se registra para nuestro Servicio, recopilamos información de identificación personal (nombre, dirección de correo, número de teléfono), credenciales profesionales (número de licencia médica, títulos, detalles de registro), información del hospital o clínica (nombre, dirección, detalles de contacto), información de autenticación (contraseñas, claves de acceso), información de perfil y preferencias. Información del Paciente: Como parte de la gestión de su práctica médica, nuestro Servicio procesa demografía del paciente, historial médico y registros de salud, datos de prescripción e información de medicamentos, información de diagnóstico y resultados de pruebas, información de facturación y pagos, datos de citas y seguimiento, certificados médicos y documentación relacionada.'
            },
            {
              title: '3. Cómo Utilizamos su Información',
              content: 'Utilizamos la información recopilada para los siguientes propósitos: Proporcionar y mantener los servicios de gestión de práctica médica, Permitir la creación de prescripciones, gestión de registros de pacientes y funciones de facturación, Generar certificados médicos y otra documentación requerida, Facilitar la programación de citas y gestión de seguimiento, Garantizar la seguridad de los datos y prevenir el acceso no autorizado, Mejorar nuestro Servicio a través del análisis de uso y retroalimentación, Proporcionar soporte al cliente y asistencia técnica, Cumplir con los requisitos legales y regulatorios.'
            },
            {
              title: '4. Almacenamiento y Seguridad de Datos',
              content: 'Almacenamiento Local: Nuestro Servicio utiliza principalmente almacenamiento local en su dispositivo para garantizar la privacidad de los datos y reducir la transmisión externa de datos. Esto significa que la mayoría de sus datos de pacientes e información de práctica se almacena localmente en su computadora o dispositivo, dándole control directo sobre sus datos. Medidas de Seguridad: Implementamos medidas de seguridad integrales para proteger su información: Encriptación de datos sensibles, Protocolos seguros de autenticación y controles de acceso, Auditorías regulares de seguridad y evaluaciones de vulnerabilidad, Acceso limitado a datos según necesidad, Procedimientos seguros de respaldo y recuperación.'
            },
            {
              title: '5. Compartir Información y Divulgación',
              content: 'No vendemos, intercambiamos o transferimos de otra manera su información personal o datos de pacientes a terceros. Solo podemos divulgar información en las siguientes circunstancias limitadas: Con su consentimiento explícito, Para cumplir con obligaciones legales u órdenes judiciales, Para proteger nuestros derechos, propiedad o seguridad, o la de otros, En relación con una transferencia comercial o fusión (con las salvaguardas apropiadas), A proveedores de servicios autorizados que asisten en la entrega del Servicio (bajo estrictos acuerdos de confidencialidad).'
            },
            {
              title: '6. Sus Derechos y Opciones',
              content: 'Tiene los siguientes derechos con respecto a su información: Acceso: Solicitar acceso a su información personal que tenemos, Corrección: Solicitar corrección de información incorrecta o incompleta, Eliminación: Solicitar eliminación de su información personal (sujeto a requisitos legales), Portabilidad: Solicitar transferencia de sus datos a otro proveedor de servicios, Restricción: Solicitar restricción del procesamiento bajo ciertas circunstancias, Retirada del Consentimiento: Retirar el consentimiento para el procesamiento de datos donde sea aplicable.'
            },
            {
              title: '7. HIPAA y Cumplimiento de Atención Médica',
              content: 'Aunque nuestro Servicio está diseñado para ayudar a los profesionales de la salud a mantener la confidencialidad del paciente y la seguridad de los datos, usted sigue siendo responsable de garantizar el cumplimiento de las regulaciones de atención médica aplicables, incluyendo pero no limitado a: Ley de Portabilidad y Responsabilidad del Seguro de Salud (HIPAA) donde sea aplicable, Regulaciones locales de protección de datos de atención médica, Requisitos de juntas de licencias médicas, Requisitos de consentimiento del paciente para el procesamiento de datos.'
            },
            {
              title: '8. Transferencias Internacionales de Datos',
              content: 'Dado que nuestro Servicio utiliza principalmente almacenamiento local, las transferencias internacionales de datos son mínimas. Sin embargo, ciertas características del Servicio pueden involucrar procesamiento de datos en diferentes jurisdicciones. Cuando ocurren tales transferencias, aseguramos que estén implementadas las salvaguardas apropiadas para proteger su información.'
            },
            {
              title: '9. Privacidad de Menores',
              content: 'Nuestro Servicio no está destinado para uso por menores de 18 años. No recopilamos conscientemente información personal de menores de 18 años. Si nos enteramos de que hemos recopilado información personal de un menor de 18 años, tomaremos medidas para eliminar dicha información.'
            },
            {
              title: '10. Notificación de Violación de Datos',
              content: 'En el improbable caso de un incidente de seguridad de datos que pueda comprometer su información, nosotros: Investigaremos el incidente de manera inmediata y exhaustiva, Tomaremos medidas inmediatas para contener y mitigar la violación, Notificaremos a los usuarios afectados dentro de 72 horas cuando sea factible, Proporcionaremos información clara sobre la naturaleza y alcance del incidente, Ofreceremos orientación sobre medidas protectoras que puede tomar, Cumpliremos con todos los requisitos aplicables de notificación de violación.'
            },
            {
              title: '11. Servicios de Terceros',
              content: 'Nuestro Servicio puede integrarse con servicios de terceros (como autenticación de Google, servicios de generación de PDF, o plataformas de comunicación). Estos servicios de terceros tienen sus propias políticas de privacidad, y le animamos a revisarlas. No somos responsables de las prácticas de privacidad de estos servicios de terceros.'
            },
            {
              title: '12. Actualizaciones a esta Política de Privacidad',
              content: 'Podemos actualizar esta Política de Privacidad de vez en cuando para reflejar cambios en nuestras prácticas, tecnología, requisitos legales u otros factores. Le notificaremos de cualquier cambio material mediante: Publicación de la política actualizada en nuestro Servicio, Envío de una notificación a través del Servicio, Proporcionar al menos 30 días de aviso para cambios materiales. Su uso continuado del Servicio después de tales modificaciones constituye aceptación de la Política de Privacidad actualizada.'
            },
            {
              title: '13. Contáctenos',
              content: 'Si tiene preguntas, inquietudes o solicitudes con respecto a esta Política de Privacidad o nuestras prácticas de datos, por favor contáctenos a través de: El sistema de soporte y retroalimentación de la aplicación, La sección de ayuda dentro del Servicio, Nuestros canales de soporte al cliente. Estamos comprometidos a abordar sus inquietudes de privacidad y responderemos a sus consultas de manera oportuna.'
            }
          ]
        };
      case 'chinese':
        return {
          title: '隐私政策',
          effectiveDate: '生效日期：',
          sections: [
            {
              title: '1. 简介',
              content: 'Doc Prescrip（"我们"、"我们的"或"我们"）致力于保护您的个人信息和患者数据的隐私和安全。本隐私政策解释了当您使用我们的医疗实践管理系统（"服务"）时，我们如何收集、使用、披露和保护您的信息。本政策适用于我们服务的所有用户，包括医疗保健专业人员和他们的授权工作人员。'
            },
            {
              title: '2. 我们收集的信息',
              content: '医疗保健专业人员信息：当您注册我们的服务时，我们收集个人身份信息（姓名、电子邮件地址、电话号码）、专业证书（医疗执照号码、学位、注册详情）、医院或诊所信息（名称、地址、联系详情）、身份验证信息（密码、访问密钥）、个人资料信息和偏好。患者信息：作为您医疗实践管理的一部分，我们的服务处理患者人口统计学、病史和健康记录、处方数据和药物信息、诊断信息和测试结果、账单和付款信息、预约和跟进数据、医疗证书和相关文档。'
            },
            {
              title: '3. 我们如何使用您的信息',
              content: '我们将收集的信息用于以下目的：提供和维护医疗实践管理服务，启用处方创建、患者记录管理和账单功能，生成医疗证书和其他所需文档，促进预约安排和跟进管理，确保数据安全并防止未经授权的访问，通过使用分析和反馈改进我们的服务，提供客户支持和技术援助，遵守法律和监管要求。'
            },
            {
              title: '4. 数据存储和安全',
              content: '本地存储：我们的服务主要使用您设备上的本地存储，以确保数据隐私并减少外部数据传输。这意味着您的大部分患者数据和实践信息都存储在您的计算机或设备本地，让您直接控制您的数据。安全措施：我们实施全面的安全措施来保护您的信息：敏感数据的加密，安全的身份验证协议和访问控制，定期的安全审计和漏洞评估，基于需要的有限数据访问，安全的备份和恢复程序。'
            },
            {
              title: '5. 信息共享和披露',
              content: '我们不向第三方出售、交易或以其他方式转移您的个人信息或患者数据。我们只能在以下有限情况下披露信息：经您明确同意，为遵守法律义务或法院命令，为保护我们的权利、财产或安全，或他人的安全，与业务转让或合并相关（有适当的保障措施），向协助服务交付的授权服务提供商（在严格的保密协议下）。'
            },
            {
              title: '6. 您的权利和选择',
              content: '关于您的信息，您拥有以下权利：访问：请求访问我们持有的您的个人信息，更正：请求更正不准确或不完整的信息，删除：请求删除您的个人信息（受法律要求限制），可移植性：请求将您的数据转移到另一个服务提供商，限制：在某些情况下请求限制处理，撤回同意：在适用的情况下撤回数据处理的同意。'
            },
            {
              title: '7. HIPAA和医疗保健合规',
              content: '虽然我们的服务旨在帮助医疗保健专业人员维护患者保密性和数据安全，但您仍有责任确保遵守适用的医疗保健法规，包括但不限于：健康保险便携性和责任法案（HIPAA）（如适用），当地医疗保健数据保护法规，医疗执照委员会要求，数据处理的患者同意要求。'
            },
            {
              title: '8. 国际数据传输',
              content: '由于我们的服务主要使用本地存储，国际数据传输是最少的。但是，某些服务功能可能涉及在不同司法管辖区的数据处理。当发生此类传输时，我们确保实施适当的保障措施来保护您的信息。'
            },
            {
              title: '9. 儿童隐私',
              content: '我们的服务不适用于18岁以下的儿童使用。我们不会故意收集18岁以下儿童的个人信息。如果我们发现我们收集了18岁以下儿童的个人信息，我们将采取措施删除此类信息。'
            },
            {
              title: '10. 数据泄露通知',
              content: '在可能危及您信息的数据安全事件的不太可能情况下，我们将：立即彻底调查事件，立即采取措施遏制和减轻泄露，在可行的情况下在72小时内通知受影响的用户，提供关于事件性质和范围的清晰信息，提供关于您可以采取的保护措施的指导，遵守所有适用的泄露通知要求。'
            },
            {
              title: '11. 第三方服务',
              content: '我们的服务可能与第三方服务（如Google身份验证、PDF生成服务或通信平台）集成。这些第三方服务有自己的隐私政策，我们鼓励您查看它们。我们不对这些第三方服务的隐私做法负责。'
            },
            {
              title: '12. 本隐私政策的更新',
              content: '我们可能会不时更新本隐私政策，以反映我们的做法、技术、法律要求或其他因素的变化。我们将通过以下方式通知您任何重大变化：在我们的服务上发布更新的政策，通过服务向您发送通知，为重大变化提供至少30天的通知。在此类修改后您继续使用服务构成对更新的隐私政策的接受。'
            },
            {
              title: '13. 联系我们',
              content: '如果您对本隐私政策或我们的数据做法有任何问题、关注或请求，请通过以下方式联系我们：应用程序的支持和反馈系统，服务内的帮助部分，我们的客户支持渠道。我们致力于解决您的隐私关注，并将及时回应您的询问。'
            }
          ]
        };
      default: // English
        return {
          title: 'Privacy Policy',
          effectiveDate: 'Effective date:',
          sections: [
            {
              title: '1. Introduction',
              content: 'Doc Prescrip ("we," "us," or "our") is committed to protecting the privacy and security of your personal information and patient data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our medical practice management system ("Service"). This policy applies to all users of our Service, including healthcare professionals and their authorized staff. We understand the sensitive nature of medical data and are committed to maintaining the highest standards of data protection and privacy in accordance with applicable healthcare regulations and data protection laws.'
            },
            {
              title: '2. Information We Collect',
              content: 'Healthcare Professional Information: When you register for our Service, we collect personal identification information (name, email address, phone number), professional credentials (medical license number, degree, registration details), hospital or clinic information (name, address, contact details), authentication information (passwords, access keys), profile information and preferences. Patient Information: As part of your medical practice management, our Service processes patient demographics (name, age, gender, contact information), medical history and health records, prescription data and medication information, diagnostic information and test results, billing and payment information, appointment and follow-up data, medical certificates and related documentation. Technical Information: We automatically collect certain technical information, including device information (type, operating system, browser), usage data (features used, time spent, activity logs), IP addresses and location information, session information and authentication logs.'
            },
            {
              title: '3. How We Use Your Information',
              content: 'We use the collected information for the following purposes: Providing and maintaining the medical practice management services, Enabling prescription creation, patient record management, and billing functions, Generating medical certificates and other required documentation, Facilitating appointment scheduling and follow-up management, Ensuring data security and preventing unauthorized access, Improving our Service through usage analysis and feedback, Providing customer support and technical assistance, Complying with legal and regulatory requirements.'
            },
            {
              title: '4. Data Storage and Security',
              content: 'Local Storage: Our Service primarily uses local storage on your device to ensure data privacy and reduce external data transmission. This means that most of your patient data and practice information is stored locally on your computer or device, giving you direct control over your data. Security Measures: We implement comprehensive security measures to protect your information: Encryption of sensitive data both in transit and at rest, Secure authentication protocols and access controls, Regular security audits and vulnerability assessments, Limited access to data on a need-to-know basis, Secure backup and recovery procedures. Data Retention: We retain your information only as long as necessary to provide our services and comply with legal obligations. Since most data is stored locally, you have control over data retention periods in accordance with your professional and legal requirements.'
            },
            {
              title: '5. Information Sharing and Disclosure',
              content: 'We do not sell, trade, or otherwise transfer your personal information or patient data to third parties. We may disclose information only in the following limited circumstances: With your explicit consent, To comply with legal obligations or court orders, To protect our rights, property, or safety, or that of others, In connection with a business transfer or merger (with appropriate safeguards), To authorized service providers who assist in Service delivery (under strict confidentiality agreements).'
            },
            {
              title: '6. Your Rights and Choices',
              content: 'You have the following rights regarding your information: Access: Request access to your personal information we hold, Correction: Request correction of inaccurate or incomplete information, Deletion: Request deletion of your personal information (subject to legal requirements), Portability: Request transfer of your data to another service provider, Restriction: Request restriction of processing under certain circumstances, Withdrawal of Consent: Withdraw consent for data processing where applicable.'
            },
            {
              title: '7. HIPAA and Healthcare Compliance',
              content: 'While our Service is designed to support healthcare professionals in maintaining patient confidentiality and data security, you remain responsible for ensuring compliance with applicable healthcare regulations, including but not limited to: Health Insurance Portability and Accountability Act (HIPAA) where applicable, Local healthcare data protection regulations, Medical licensing board requirements, Patient consent requirements for data processing.'
            },
            {
              title: '8. International Data Transfers',
              content: 'Since our Service primarily uses local storage, international data transfers are minimal. However, certain Service features may involve data processing in different jurisdictions. When such transfers occur, we ensure appropriate safeguards are in place to protect your information.'
            },
            {
              title: '9. Children\'s Privacy',
              content: 'Our Service is not intended for use by children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.'
            },
            {
              title: '10. Data Breach Notification',
              content: 'In the unlikely event of a data security incident that may compromise your information, we will: Investigate the incident promptly and thoroughly, Take immediate steps to contain and mitigate the breach, Notify affected users within 72 hours when feasible, Provide clear information about the nature and scope of the incident, Offer guidance on protective measures you can take, Comply with all applicable breach notification requirements.'
            },
            {
              title: '11. Third-Party Services',
              content: 'Our Service may integrate with third-party services (such as Google authentication, PDF generation services, or communication platforms). These third-party services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of these third-party services.'
            },
            {
              title: '12. Updates to This Privacy Policy',
              content: 'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by: Posting the updated policy on our Service, Sending you a notification through the Service, Providing at least 30 days\' notice for material changes. Your continued use of the Service after such modifications constitutes acceptance of the updated Privacy Policy.'
            },
            {
              title: '13. Contact Us',
              content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through: The application\'s support and feedback system, The help section within the Service, Our customer support channels. We are committed to addressing your privacy concerns and will respond to your inquiries in a timely manner.'
            }
          ]
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header with Logo and Language Selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center space-x-3">
              <DocPill className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Doc Prescrip</h1>
            </div>
          </div>
          <div className="w-48">
            <CustomDropdown
              options={languageOptions}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              placeholder="Select Language"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {content.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {content.effectiveDate} {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            {content.sections.map((section, index) => (
              <section key={index}>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {section.title}
                </h3>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p>{section.content}</p>
                </div>
              </section>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              By using Doc Prescrip, you acknowledge that you have read, understood, and agree to this Privacy Policy. 
              We are committed to protecting your privacy and maintaining the security of your medical practice data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}