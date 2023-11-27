import type { NextPage } from "next";
import Image from "next/image";
import i18next from "i18next";
import { getAllLanguageSlugs, getLanguage } from "@/resources/i18n/config";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { batchUpdate } from "@/store/features/burger";
import {
  getTotalSupply,
  getQuote,
  burgerGasPerNeoPerSecond,
} from "@/resources/utils/api/rpcApi";
import { walletApi } from "@/resources/utils/api/walletApi";
import { integerToDecimal, formatNumber } from "@/resources/utils/convertors";
import neoBurger from "@/resources/images/neo-burger.svg";
import mBackground from "@/resources/images/m-background.svg";
import intro from "@/resources/images/intro.gif";
import rewards from "@/resources/images/rewards.gif";
import split from "@/resources/images/split.gif";
import connectionZh from "@/resources/images/connection-zh.svg";
import connection from "@/resources/images/connection.svg";
import BurgerStation from "@/components/BurgerStation";
import JazzUp from "@/components/JazzUp";
import Alert from "@/components/Alert";
import style_pc from "./Home.pc.module.css";
import style_mobile from "./Home.mobile.module.css";
import { isMobile } from "react-device-detect";

interface Props {
  setShowDrawer: (show: boolean) => void
}

const Home: NextPage<Props> = ({ setShowDrawer }) => {
  const { t } = i18next;

  const router = useRouter();
  const dispatch = useAppDispatch();
  const address = useAppSelector((state) => state.burger.address); // 钱包地址
  const network = useAppSelector((state) => state.burger.network); // 当前网络
  const walletName = useAppSelector((state) => state.burger.walletName); // 连接的钱包名称
  const quoteArr = useAppSelector((state) => state.burger.quoteArr); // NEO、GAS分别对应的usdt价格

  const [totalSupply, setTotalSupply] = useState(); // 所有人已转换的bNEO数量
  const [operateType, setOperateType] = useState<"burgerStation" | "jazzUp">(
    "burgerStation"
  ); // 操作界面切换
  const [apr, setApr] = useState("-%"); // 收益年度百分比
  const [style, setStyle]: any = useState(style_pc);
  const operateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStyle(isMobile ? style_mobile : style_pc);
    // 获取所有人已转换的bNEO数量
    getTotalSupply().then((res) => {
      const totalSupply = res?.stack?.[0]?.value;
      setTotalSupply(totalSupply);
    });
  }, []);

  useEffect(() => {
    // 获取NEO、GAS分别对应的usdt价格
    getQuote().then((res: any) => {
      res && dispatch(batchUpdate({ quoteArr: res }));
    });
  }, [dispatch]);

  useEffect(() => {
    if (address) {
      // 获取钱包资产
      walletApi[walletName]?.getBalance();
    }
  }, [address, network, walletName]);

  // 跳转至操作区
  const jumpToOperate = useCallback(() => {
    operateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setOperateType("jazzUp");
  }, []);

  // 收益年度百分比
  useEffect(() => {
    if (!quoteArr?.[1]) {
      setApr("-%");
      return;
    }
    const neoPerGas = new BigNumber(quoteArr[1]).dividedBy(quoteArr[0]);
    const secondsPerYear = 60 * 60 * 24 * 365;
    burgerGasPerNeoPerSecond().then((res) => {
      if (!res) {
        setApr("-%");
        return;
      }
      setApr(
        `${new BigNumber(res)
          .shiftedBy(-8)
          .times(secondsPerYear)
          .times(neoPerGas)
          .times(100)
          .decimalPlaces(2)
          .toString()}%`
      );
    });
  }, [quoteArr]);

  const exchangeRate = useMemo(() => {
    if (totalSupply && quoteArr?.[0]) {
      return `$ ${formatNumber(
        new BigNumber(integerToDecimal(totalSupply, 8))
          .times(quoteArr[0])
          .toString(),
        {
          decimals: 2,
        }
      )}`;
    } else {
      return `$ -`;
    }
  }, [totalSupply, quoteArr]);

  return (
    <div>
      <div className={style.topBackground}>
        <section className={style.topSection}>
          <div>
            <h1 className={style.title}>{t("name")}</h1>
            <p className={style.introduction}>{t("introduction")}</p>
            <div className={style.bubbleWrap}>
              <div className={style.bubbleContent}>
                <div className={style.bubbleTitle}>{t("totalSupply")}</div>
                <div className={style.bubbleText}>
                  {totalSupply
                    ? formatNumber(integerToDecimal(totalSupply, 8))
                    : "-"}
                </div>
                <div className={style.totalPrice}>{exchangeRate}</div>
              </div>
              <div className={style.hideInMobile}>
                <div className={style.bubbleTitle}>APR</div>
                <div className={style.bubbleText}>{apr}</div>
              </div>
            </div>
            <div
              className={`${style.bubbleWrap} ${style.hideInPC} ${style.marginBottom50}`}
            >
              <div className={style.bubbleContent}>
                <div className={style.bubbleTitle}>APR</div>
                <div className={style.bubbleText}>{apr}</div>
              </div>
            </div>
          </div>
          <div className={style.introLogo}>
            <Image src={intro} alt="intro" />
          </div>
        </section>
        <div className={style.mBackground}>
          <Image src={mBackground} alt="intro" sizes="100%" />
        </div>
      </div>
      <main className={style.main} id="main">
        <div className={style.operateWrap} ref={operateRef}>
          <div className={style.switchBtnWrap}>
            <div
              className={`${style.switchBtn} ${operateType === "burgerStation" && style.switchBtnSelected
                }`}
              onClick={() => setOperateType("burgerStation")}
            >
              {t("burgerStation")}
            </div>
            <div
              className={`${style.switchBtn} ${operateType === "jazzUp" && style.switchBtnSelected
                }`}
              onClick={() => setOperateType("jazzUp")}
            >
              {t("jazzUp")}
            </div>
          </div>
          <BurgerStation
            className={
              operateType !== "burgerStation" ? style.hideInMobile : ""
            }
            setShowDrawer={setShowDrawer}
          />
          <JazzUp
            className={operateType !== "jazzUp" ? style.hideInMobile : ""}
            setShowDrawer={setShowDrawer}
          />
        </div>
        <section className={style.section}>
          <h1 className={style.sectionTitle}>{t("what")}</h1>
          <div className={style.sectionCard}>
            <div className={`${style.sectionImgWrapperM} ${style.width205}`}>
              <Image src={neoBurger} alt="NeoBurger" />
            </div>
            <div className={style.sectionImgWrapperPC}>
              <Image src={neoBurger} alt="NeoBurger" />
            </div>
            <div className={`${style.sectionContent} ${style.marginLeft200}`}>
              <strong className={style.sectionStrongText}>
                {t("whatExplain")}
              </strong>
              {router.locale === "zh" ? (
                <strong className={style.sectionStrongText}>
                  {t("whatExplain1")}
                </strong>
              ) : null}
              <div className={style.marginBottom24}>
                <strong className={style.sectionMiniStrongText1}>
                  {t("contractAddress")}
                </strong>
                <p className={style.sectionText}>
                  NPmdLGJN47EddqYcxixdGMhtkr7Z5w4Aos
                </p>
              </div>
              <div>
                <strong className={style.sectionMiniStrongText1}>
                  {t("scriptHash")}
                </strong>
                <p className={style.sectionText}>
                  0x48c40d4666f93408be1bef038b6722404d9a4c2a
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className={style.section}>
          <h1 className={`${style.sectionTitle} ${style.lineHeight40}`}>
            {t("why")}
          </h1>
          <div className={style.sectionCard}>
            <div className={`${style.sectionImgWrapperM} ${style.width240}`}>
              <Image src={split} alt="split" />
            </div>
            <div className={`${style.sectionContent} ${style.marginRight150}`}>
              <strong className={style.sectionStrongText}>
                1 NEO = 1.00000000 bNEO
              </strong>
              <p className={`${style.sectionText} ${style.marginBottom24}`}>
                {t("whyExplain1")}
              </p>
              <p className={style.sectionText}>{t("whyExplain2")}</p>
            </div>
            <div className={`${style.sectionImgWrapperPC} ${style.width385}`}>
              <Image src={split} alt="split" />
            </div>
          </div>
        </section>
        <section className={`${style.section} ${style.textAlignCenter}`}>
          <h1 className={`${style.sectionTitle} ${style.lineHeight40}`}>
            {t("where")}
          </h1>
          <div className={style.sectionImgWrapperM}>
            {t("language") === "en" ? (
              <Image src={connection} alt="connection" />
            ) : (
              <Image src={connectionZh} alt="connection" />
            )}
          </div>
          <p className={style.sectionTextCenter}>{t("whereExplain1")} </p>
          <strong className={style.sectionMiniStrongTextCenter}>
            {t("whereExplain2")}
          </strong>
          <div className={style.sectionImgWrapperPC}>
            {t("language") === "en" ? (
              <Image src={connection} alt="connection" />
            ) : (
              <Image src={connectionZh} alt="connection" />
            )}
          </div>
        </section>
        <section className={style.section}>
          <div className={`${style.sectionCard} ${style.hideInMobile}`}>
            <div className={style.sectionContentMiddle}>
              <h1 className={style.sectionTitle}>{t("how")}</h1>
              <strong
                className={style.sectionMiniStrongText}
                onClick={() => jumpToOperate()}
              >
                {t("howExplain1")}
                <a className={style.jumpText} onClick={() => jumpToOperate()}>
                  {t("howExplain2")}
                </a>
                {t("howExplain3")}
              </strong>
            </div>
            <div className={`${style.marginLeft200} ${style.width160}`}>
              <Image src={rewards} alt="rewards" />
            </div>
          </div>
          <div className={style.sectionCardMobile}>
            <h1 className={style.howTitle}>{t("how")}</h1>
            <strong className={style.howText}>
              {t("howExplain1")}
              <a className={style.jumpText} onClick={() => jumpToOperate()}>
                {t("howExplain2")}
              </a>
              {t("howExplain3")}
            </strong>
            <div className={style.howImage}>
              <Image src={rewards} alt="rewards" />
            </div>
          </div>
        </section>
      </main>
      {address && network !== "N3MainNet" && network !== "MainNet" ? (
        <Alert value={t("networkErr")} />
      ) : null}
    </div>
  );
};

export async function getStaticPaths() {
  const paths = getAllLanguageSlugs();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: any) {
  const language = getLanguage(params.lang);
  return {
    props: {
      language,
    },
  };
}

export default Home;
